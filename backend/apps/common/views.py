from rest_framework import viewsets

from apps.organizations.models import OrganizationUser


class OrganizationScopedViewSet(viewsets.ModelViewSet):
    """
    Base viewset for organization-scoped resources.

    Provides helper methods for retrieving the current
    authenticated user's active organization membership.
    """

    def get_membership(self):
        if not hasattr(self, "_organization_membership"):
            self._organization_membership = (
                OrganizationUser.objects
                .select_related("organization")
                .filter(
                    user=self.request.user,
                    is_active=True,
                )
                .first()
            )

        return self._organization_membership

    def get_organization(self):
        membership = self.get_membership()

        if membership:
            return membership.organization

        if hasattr(self.request.user, "organization") and self.request.user.organization:
            return self.request.user.organization

        from apps.organizations.models import Organization
        return Organization.objects.first()


class PaymentReversalLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only audit register of all reversed payments (Savings, Shares, Loan Repayments).
    Provides tamper-proof historical trace triggered on every reversal.
    """
    from apps.common.models import PaymentReversalLog
    from apps.common.serializers import PaymentReversalLogSerializer
    from rest_framework import permissions, filters

    queryset = PaymentReversalLog.objects.select_related("member", "reversed_by", "organization").all()
    serializer_class = PaymentReversalLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "document_or_receipt_no",
        "original_payment_id",
        "reversal_reason",
        "member__first_name",
        "member__other_names",
        "member__membership_number",
        "reversed_by__username",
    ]
    ordering_fields = ["reversed_at", "amount_reversed", "created_at"]
    ordering = ["-reversed_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        org = getattr(self.request.user, "organization", None)
        if org:
            qs = qs.filter(organization=org)

        p_type = self.request.query_params.get("payment_type")
        member_id = self.request.query_params.get("member")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        if p_type and p_type != "all":
            qs = qs.filter(payment_type=p_type)
        if member_id:
            qs = qs.filter(member_id=member_id)
        if start_date:
            qs = qs.filter(reversed_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(reversed_at__date__lte=end_date)

        return qs