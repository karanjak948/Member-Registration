from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from apps.loans.models import LoanProduct
from apps.loans.serializers import LoanProductSerializer
from apps.organizations.permissions import is_admin_or_owner_user


class LoanProductViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Loan Products with automatic immutable versioning.
    Mutating operations (create, update, delete) are restricted to Admins and Owners.
    """
    queryset = LoanProduct.objects.all().prefetch_related("fees", "penalties")
    serializer_class = LoanProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["product_code", "product_name"]
    ordering_fields = ["product_code", "version_number", "created_at"]
    ordering = ["product_code", "-version_number"]

    def create(self, request, *args, **kwargs):
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can create loan products."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can modify loan products."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can modify loan products."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can delete loan products."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        include_archived = self.request.query_params.get("include_archived")
        if include_archived in ("true", "1", "True"):
            return qs
        active_only = self.request.query_params.get("active_only")
        if active_only in ("false", "0", "False"):
            return qs
        return qs.filter(is_active=True)

