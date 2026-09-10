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

from apps.loans.models import MpesaTransaction, MpesaTransactionStatus, Loan
from apps.loans.serializers.repayment_serializers import RepaymentSerializer
from apps.loans.services.mpesa_service import MpesaC2BService
from rest_framework import serializers

logger = logging.getLogger(__name__)


class MpesaTransactionSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
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

        try:
            if not isinstance(payload, dict):
                logger.warning(f"Unexpected non-dict payload received: {payload}")
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
            return Response(res, status=status.HTTP_200_OK)

        except Exception as exc:
            logger.exception(f"Fatal error handling M-Pesa confirmation callback: {exc}")
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
        if status_filter:
            qs = qs.filter(status__iexact=status_filter)
        return qs

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
