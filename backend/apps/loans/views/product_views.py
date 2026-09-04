from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from apps.loans.models import LoanProduct
from apps.loans.serializers import LoanProductSerializer


class LoanProductViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Loan Products with automatic immutable versioning.
    """
    queryset = LoanProduct.objects.all().prefetch_related("fees", "penalties")
    serializer_class = LoanProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["product_code", "product_name"]
    ordering_fields = ["product_code", "version_number", "created_at"]
    ordering = ["product_code", "-version_number"]

    def get_queryset(self):
        qs = super().get_queryset()
        include_archived = self.request.query_params.get("include_archived")
        if include_archived in ("true", "1", "True"):
            return qs
        active_only = self.request.query_params.get("active_only")
        if active_only in ("false", "0", "False"):
            return qs
        return qs.filter(is_active=True)
