"""
M-Pesa C2B Paybill API Views.
Exposes public endpoints for Safaricom Daraja callbacks and an authenticated viewset
for auditing and managing received M-Pesa payments.
"""

from __future__ import annotations

import logging
from rest_framework import status, permissions, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action

from apps.loans.models import (
    MpesaTransaction,
    MpesaTransactionStatus,
    MpesaReceivedPayment,
    MpesaReceivedPaymentStatus,
    Loan,
)
from apps.loans.serializers.repayment_serializers import RepaymentSerializer
from apps.loans.services.mpesa_service import MpesaC2BService
from rest_framework import serializers

logger = logging.getLogger(__name__)


class MpesaTransactionSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    member_phone = serializers.SerializerMethodField()
    member_number = serializers.SerializerMethodField()
    member_national_id = serializers.SerializerMethodField()
    is_payer_registered_phone = serializers.SerializerMethodField()
    sms_status = serializers.SerializerMethodField()
    loan_number = serializers.CharField(source="loan.loan_number", read_only=True, default=None)
    repayment_number = serializers.CharField(source="repayment.repayment_number", read_only=True, default=None)

    class Meta:
        model = MpesaTransaction
        fields = [
            "id",
            "trans_id",
            "transaction_type",
            "trans_time",
            "trans_amount",
            "business_short_code",
            "bill_ref_number",
            "invoice_number",
            "org_account_balance",
            "third_party_trans_id",
            "msisdn",
            "first_name",
            "status",
            "member",
            "member_name",
            "member_phone",
            "member_number",
            "member_national_id",
            "is_payer_registered_phone",
            "sms_status",
            "loan",
            "loan_number",
            "repayment",
            "repayment_number",
            "unique_serial",
            "verify_url",
            "is_verified",
            "verification_response",
            "error_message",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_member_name(self, obj):
        if obj.member:
            return f"{obj.member.first_name} {obj.member.other_names}".strip()
        return obj.first_name or "—"

    def get_member_phone(self, obj):
        return obj.member.phone_number if obj.member else None

    def get_member_number(self, obj):
        return obj.member.membership_number if obj.member else None

    def get_member_national_id(self, obj):
        return obj.member.national_id if obj.member else None

    def get_is_payer_registered_phone(self, obj):
        if not obj.member or not obj.member.phone_number:
            return None
        from apps.common.sms_service import BulkSMSService
        clean_msisdn = BulkSMSService.format_phone_number(obj.msisdn)
        clean_member_phone = BulkSMSService.format_phone_number(obj.member.phone_number)
        return clean_msisdn == clean_member_phone

    def get_sms_status(self, obj):
        try:
            from apps.members.models.sms_log import SMSLog
            log = SMSLog.objects.filter(message__icontains=obj.trans_id).order_by("-created_at").first()
            if log:
                return {
                    "sent": log.status == "sent",
                    "status": log.status,
                    "phone": log.phone_number,
                    "dispatched_at": log.created_at,
                }
        except Exception:
            pass
        return None


class MpesaC2BConfirmationView(APIView):
    """
    Safaricom Daraja M-Pesa C2B Paybill Confirmation Endpoint &
    Royal SACCO Relay Verification Endpoint.

    Receives either:
    1. Direct Safaricom Daraja C2B confirmation:
       {"TransactionType": "Pay Bill", "TransID": "...", ...}
    2. Relay callback with verification handshake:
       {
         "unique_serial": 1548,
         "verify_url": "https://system.royalltd.co.ke/payments/verifypayment",
         "paymentPayload": {
           "TransactionType": "Pay Bill",
           "TransID": "...",
           ...
         }
       }
       Header: X-API-Key: <key>
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        payload = request.data
        logger.info(f"Incoming M-Pesa Confirmation / Relay Request: {payload}")

        # Extract Client IP
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.META.get("REMOTE_ADDR")

        # Create raw incoming log record in mpesa_receivedmpesapayments
        log_entry = None
        try:
            import json
            raw_serial = payload.get("unique_serial") if isinstance(payload, dict) else None
            serial_int = None
            if raw_serial is not None:
                try:
                    serial_int = int(raw_serial)
                except (ValueError, TypeError):
                    pass

            raw_trans_id = None
            if isinstance(payload, dict):
                pp = payload.get("paymentPayload")
                if isinstance(pp, dict):
                    raw_trans_id = pp.get("TransID") or pp.get("trans_id")
                if not raw_trans_id:
                    raw_trans_id = payload.get("TransID") or payload.get("trans_id")

            payload_str = json.dumps(payload) if isinstance(payload, (dict, list)) else str(payload)
            verify_url_val = payload.get("verify_url") if isinstance(payload, dict) else None

            log_entry = MpesaReceivedPayment.objects.create(
                unique_serial=serial_int,
                mpesa_payload=payload_str,
                transID=str(raw_trans_id)[:40] if raw_trans_id else None,
                verify_url=str(verify_url_val)[:255] if verify_url_val else None,
                status=MpesaReceivedPaymentStatus.RECEIVED,
                ipaddress=str(client_ip)[:45] if client_ip else None,
            )
        except Exception as log_err:
            logger.warning(f"Could not record incoming payment log: {log_err}")

        try:
            if not isinstance(payload, dict):
                logger.warning(f"Unexpected non-dict payload received: {payload}")
                if log_entry:
                    log_entry.status = MpesaReceivedPaymentStatus.FAILED
                    log_entry.message = "Non-dict payload received"
                    log_entry.save(update_fields=["status", "message"])
                return Response(
                    {"ResultCode": 0, "ResultDesc": "Accepted"},
                    status=status.HTTP_200_OK,
                )

            # 1. API Key Authentication (if configured in settings)
            from django.conf import settings
            configured_api_key = getattr(settings, "ROYAL_PAYMENTS_API_KEY", "")
            incoming_api_key = (
                request.headers.get("X-API-Key")
                or request.headers.get("x-api-key")
                or request.META.get("HTTP_X_API_KEY")
            )

            # 2. Check if this is a relay-wrapped payload or direct C2B callback
            unique_serial = payload.get("unique_serial")
            verify_url = payload.get("verify_url")
            payment_payload = payload.get("paymentPayload")

            is_relay = (unique_serial is not None) or bool(payment_payload)

            # If an API key is configured and either incoming key was provided OR it is a relay request, validate the key
            if configured_api_key:
                if is_relay or incoming_api_key:
                    if incoming_api_key != configured_api_key:
                        logger.warning(
                            f"Unauthorized M-Pesa request: Invalid or missing X-API-Key. Received: {incoming_api_key}"
                        )
                        if log_entry:
                            log_entry.status = MpesaReceivedPaymentStatus.FAILED
                            log_entry.message = "Unauthorized: Invalid or missing X-API-Key"
                            log_entry.save(update_fields=["status", "message"])
                        return Response(
                            {"error": "Unauthorized: Invalid or missing X-API-Key."},
                            status=status.HTTP_401_UNAUTHORIZED,
                        )

            # Extract actual payment payload
            if isinstance(payment_payload, dict):
                actual_payload = payment_payload
            else:
                actual_payload = payload

            # 3. Handle Relay Handshake Flow
            if unique_serial is not None:
                if not verify_url:
                    verify_url = getattr(
                        settings,
                        "ROYAL_PAYMENTS_DEFAULT_VERIFY_URL",
                        "https://system.royalltd.co.ke/payments/verifypayment",
                    )

                logger.info(
                    f"Initiating relay verification for unique_serial={unique_serial} against {verify_url}"
                )
                is_valid, verify_data = MpesaC2BService.verify_with_relay(
                    verify_url=verify_url,
                    unique_serial=unique_serial,
                    api_key=incoming_api_key or configured_api_key,
                )

                if not is_valid:
                    logger.error(f"Relay verification handshake rejected serial {unique_serial}: {verify_data}")
                    tx, _ = MpesaC2BService.process_confirmation(
                        payload=actual_payload,
                        unique_serial=unique_serial,
                        verify_url=verify_url,
                        is_verified=False,
                        verification_data={"error": verify_data},
                    )
                    if log_entry:
                        log_entry.status = MpesaReceivedPaymentStatus.FAILED
                        log_entry.verification_response = str(verify_data)
                        log_entry.message = f"Relay verification handshake rejected: {verify_data}"
                        log_entry.save(update_fields=["status", "verification_response", "message"])
                    return Response(
                        {"ResultCode": 1, "ResultDesc": f"Verification failed: {verify_data}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Cross-check verify response against payment payload
                matches, match_msg = MpesaC2BService.validate_payload_match(actual_payload, verify_data)
                if not matches:
                    logger.error(f"Relay payload verification mismatch for serial {unique_serial}: {match_msg}")
                    tx, _ = MpesaC2BService.process_confirmation(
                        payload=actual_payload,
                        unique_serial=unique_serial,
                        verify_url=verify_url,
                        is_verified=False,
                        verification_data={"error": match_msg, "relay_response": verify_data},
                    )
                    if log_entry:
                        log_entry.status = MpesaReceivedPaymentStatus.FAILED
                        log_entry.verification_response = str(verify_data)
                        log_entry.message = f"Payload mismatch: {match_msg}"
                        log_entry.save(update_fields=["status", "verification_response", "message"])
                    return Response(
                        {"ResultCode": 1, "ResultDesc": f"Payload mismatch: {match_msg}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Relay verification succeeded!
                tx, res = MpesaC2BService.process_confirmation(
                    payload=actual_payload,
                    unique_serial=unique_serial,
                    verify_url=verify_url,
                    is_verified=True,
                    verification_data=verify_data,
                )
                logger.info(
                    f"Relay M-Pesa transaction {tx.trans_id} processed successfully. Status: {tx.status}"
                )
                if log_entry:
                    log_entry.status = MpesaReceivedPaymentStatus.PROCESSED
                    log_entry.transID = tx.trans_id
                    log_entry.verification_response = str(verify_data)
                    log_entry.message = f"Accepted. Status: {tx.status}. TransID: {tx.trans_id}"
                    log_entry.save(update_fields=["status", "transID", "verification_response", "message"])

                return Response(
                    {"ResultCode": 0, "ResultDesc": "Accepted", "unique_serial": unique_serial, "status": tx.status},
                    status=status.HTTP_200_OK,
                )

            # 4. Direct Safaricom Daraja C2B Callback Flow
            tx, res = MpesaC2BService.process_confirmation(
                payload=actual_payload,
                unique_serial=None,
                verify_url=None,
                is_verified=True,
            )
            logger.info(f"Direct C2B Confirmation processed successfully: TransID={tx.trans_id}, Status={tx.status}")
            if log_entry:
                log_entry.status = MpesaReceivedPaymentStatus.PROCESSED
                log_entry.transID = tx.trans_id
                log_entry.message = f"Accepted. Status: {tx.status}. TransID: {tx.trans_id}"
                log_entry.save(update_fields=["status", "transID", "message"])

            return Response(res, status=status.HTTP_200_OK)

        except Exception as exc:
            logger.exception(f"Fatal error handling M-Pesa confirmation callback: {exc}")
            if log_entry:
                log_entry.status = MpesaReceivedPaymentStatus.FAILED
                log_entry.message = f"Fatal error: {exc}"
                log_entry.save(update_fields=["status", "message"])
            # Safaricom requires 200 OK with ResultCode: 0 to acknowledge receipt
            return Response(
                {"ResultCode": 0, "ResultDesc": "Accepted"},
                status=status.HTTP_200_OK,
            )


class MpesaC2BValidationView(APIView):
    """
    Safaricom Daraja M-Pesa C2B Validation Endpoint (Optional but recommended).
    Safaricom calls this prior to completing the transaction to check if account is valid.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        payload = request.data
        logger.info(f"Incoming Safaricom C2B Validation: {payload}")

        # Optional audit log
        try:
            import json
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            client_ip = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else request.META.get("REMOTE_ADDR")
            raw_trans_id = payload.get("TransID") if isinstance(payload, dict) else None
            MpesaReceivedPayment.objects.create(
                mpesa_payload=json.dumps(payload) if isinstance(payload, (dict, list)) else str(payload),
                transID=str(raw_trans_id)[:40] if raw_trans_id else None,
                status=MpesaReceivedPaymentStatus.PROCESSED,
                message="Validation Accepted",
                ipaddress=str(client_ip)[:45] if client_ip else None,
            )
        except Exception:
            pass

        # Accept transaction by default
        return Response(
            {"ResultCode": 0, "ResultDesc": "Accepted"},
            status=status.HTTP_200_OK,
        )



class MpesaTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Administrative API to inspect all received M-Pesa Paybill payments
    and manually allocate unallocated transactions.
    """
    queryset = MpesaTransaction.objects.all().select_related("member", "loan", "repayment")
    serializer_class = MpesaTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "trans_id",
        "bill_ref_number",
        "first_name",
        "msisdn",
        "loan__loan_number",
        "member__first_name",
        "member__other_names",
        "member__national_id",
    ]
    ordering_fields = ["trans_time", "trans_amount", "created_at"]
    ordering = ["-trans_time"]

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        if status_filter and status_filter.upper() != "ALL":
            qs = qs.filter(status__iexact=status_filter)
        date_from = self.request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(trans_time__date__gte=date_from)
        date_to = self.request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(trans_time__date__lte=date_to)
        return qs

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """
        Aggregate summary metrics for M-Pesa reporting.
        """
        from django.db.models import Sum
        from decimal import Decimal

        qs = self.get_queryset()
        total_count = qs.count()
        total_amount = qs.aggregate(s=Sum("trans_amount"))["s"] or Decimal("0.00")

        completed_qs = qs.filter(status=MpesaTransactionStatus.COMPLETED)
        completed_count = completed_qs.count()
        completed_amount = completed_qs.aggregate(s=Sum("trans_amount"))["s"] or Decimal("0.00")

        unallocated_qs = qs.filter(status=MpesaTransactionStatus.UNALLOCATED)
        unallocated_count = unallocated_qs.count()
        unallocated_amount = unallocated_qs.aggregate(s=Sum("trans_amount"))["s"] or Decimal("0.00")

        failed_count = qs.filter(status__in=[MpesaTransactionStatus.FAILED, MpesaTransactionStatus.VERIFICATION_FAILED]).count()

        return Response({
            "total_count": total_count,
            "total_amount": float(total_amount),
            "completed_count": completed_count,
            "completed_amount": float(completed_amount),
            "unallocated_count": unallocated_count,
            "unallocated_amount": float(unallocated_amount),
            "failed_count": failed_count,
        })

    @action(detail=True, methods=["post"], url_path="allocate")
    def allocate(self, request, pk=None):
        """
        Manually allocates an UNALLOCATED M-Pesa payment to a specified Loan.
        Body: { "loan_id": <id> }
        """
        tx: MpesaTransaction = self.get_object()
        loan_id = request.data.get("loan_id")

        if not loan_id:
            return Response({"error": "loan_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            loan = Loan.objects.get(id=loan_id)
        except Loan.DoesNotExist:
            return Response({"error": "Target loan facility not found."}, status=status.HTTP_404_NOT_FOUND)

        if tx.repayment:
            return Response(
                {"error": f"Transaction already allocated to repayment {tx.repayment.repayment_number}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payer_info = f"{tx.first_name} ({tx.msisdn})".strip()
        notes = f"Manually allocated M-Pesa C2B Paybill payment from {payer_info}. Ref: {tx.bill_ref_number}"

        serializer = RepaymentSerializer(
            data={
                "loan": loan.id,
                "amount_paid": tx.trans_amount,
                "payment_date": tx.trans_time.date(),
                "payment_method": "mpesa",
                "transaction_reference": tx.trans_id,
                "notes": notes,
            },
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        repayment = serializer.save()

        tx.loan = loan
        tx.member = loan.member
        tx.repayment = repayment
        tx.status = MpesaTransactionStatus.COMPLETED
        tx.error_message = ""
        tx.save(update_fields=["loan", "member", "repayment", "status", "error_message"])

        return Response(MpesaTransactionSerializer(tx).data)


class MpesaReceivedPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MpesaReceivedPayment
        fields = [
            "id",
            "unique_serial",
            "mpesa_payload",
            "transID",
            "verify_url",
            "status",
            "message",
            "verification_response",
            "createdon",
            "ipaddress",
        ]
        read_only_fields = fields


class MpesaReceivedPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Administrative API to audit raw incoming M-Pesa webhooks (Daraja & Relay).
    """
    queryset = MpesaReceivedPayment.objects.all().order_by("-createdon")
    serializer_class = MpesaReceivedPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["transID", "ipaddress", "message", "status"]
    ordering_fields = ["createdon", "status"]
    ordering = ["-createdon"]

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        if status_filter and status_filter.upper() != "ALL":
            qs = qs.filter(status__iexact=status_filter)
        date_from = self.request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(createdon__date__gte=date_from)
        date_to = self.request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(createdon__date__lte=date_to)
        return qs
