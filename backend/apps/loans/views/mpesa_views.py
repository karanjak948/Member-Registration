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
    Safaricom Daraja M-Pesa C2B Paybill Confirmation Endpoint.
    Receives JSON callbacks whenever a customer pays via Paybill.
    Must respond with {"ResultCode": 0, "ResultDesc": "Accepted"} within < 5s.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        payload = request.data
        logger.info(f"Incoming Safaricom C2B Confirmation: {payload}")

        try:
            if not isinstance(payload, dict):
                logger.warning(f"Unexpected non-dict payload received: {payload}")
                return Response(
                    {"ResultCode": 0, "ResultDesc": "Accepted"},
                    status=status.HTTP_200_OK,
                )

            tx, res = MpesaC2BService.process_confirmation(payload)
            logger.info(f"C2B Confirmation processed successfully: TransID={tx.trans_id}, Status={tx.status}")
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
