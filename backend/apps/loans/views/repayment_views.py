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
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if loan_id:
            qs = qs.filter(loan_id=loan_id)
        if start_date:
            qs = qs.filter(payment_date__gte=start_date)
        if end_date:
            qs = qs.filter(payment_date__lte=end_date)
        return qs
