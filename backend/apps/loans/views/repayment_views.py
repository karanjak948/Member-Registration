from rest_framework import viewsets, permissions, filters
from apps.loans.models import Repayment
from apps.loans.serializers import RepaymentSerializer


class RepaymentViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Loan Repayments.
    Creating a repayment triggers automatic waterfall allocation and ledger posting.
    """
    queryset = Repayment.objects.all().select_related("loan", "loan__member", "recorded_by")
    serializer_class = RepaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "repayment_number",
        "transaction_reference",
        "loan__loan_number",
        "loan__member__first_name",
        "loan__member__other_names",
        "loan__member__membership_number",
    ]
    ordering_fields = ["payment_date", "amount_paid", "created_at"]
    ordering = ["-payment_date", "-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        loan_id = self.request.query_params.get("loan_id")
        if loan_id:
            qs = qs.filter(loan_id=loan_id)
        return qs
