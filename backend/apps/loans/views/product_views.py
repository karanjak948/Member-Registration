from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
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

    def get_object(self):
        """
        Ensure archived/hidden loan products can always be retrieved, modified,
        or re-enabled by ID by administrators.
        For normal users, inactive/hidden products return 404.
        """
        user = getattr(self.request, "user", None)
        is_admin = bool(user and user.is_authenticated and is_admin_or_owner_user(user))

        queryset = LoanProduct.objects.all().prefetch_related("fees", "penalties")
        if not is_admin:
            queryset = queryset.filter(is_active=True)

        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = queryset.filter(**filter_kwargs).first()
        if obj is not None:
            self.check_object_permissions(self.request, obj)
            return obj
        return super().get_object()

    @action(detail=True, methods=["post", "patch"], url_path="toggle-status")
    def toggle_status(self, request, pk=None):
        """
        Enable or hide/archive a loan product.
        """
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can enable or hide loan products."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            product = self.get_object()
        except Exception:
            product = LoanProduct.objects.filter(pk=pk).first()
            if not product:
                return Response(
                    {"error": f"Loan product with ID {pk} not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        if "is_active" in request.data:
            val = request.data["is_active"]
            product.is_active = bool(val in (True, 1, "1", "true", "True"))
        else:
            product.is_active = not product.is_active

        product.save(update_fields=["is_active", "updated_at"])
        serializer = self.get_serializer(product)
        state_str = "enabled and visible" if product.is_active else "hidden and archived"
        return Response({
            "success": True,
            "is_active": product.is_active,
            "message": f"Loan product '{product.product_name}' ({product.product_code}) is now {state_str}.",
            "product": serializer.data,
        })

    def get_queryset(self):
        qs = super().get_queryset()

        user = getattr(self.request, "user", None)
        is_admin = bool(user and user.is_authenticated and is_admin_or_owner_user(user))

        # CRITICAL PRIVILEGE ENFORCEMENT:
        # Standard / normal users can ONLY ever see active & visible loan products.
        # When an admin hides a loan product, it must DISAPPEAR COMPLETELY for normal users.
        if not is_admin:
            return qs.filter(is_active=True)

        # For Administrators and Owners:
        # Detail requests (retrieve, toggle_status, update, partial_update, destroy)
        # must always find the product even if hidden/archived so admin can manage/unhide it.
        if getattr(self, "detail", False) or self.action in ("retrieve", "toggle_status", "update", "partial_update", "destroy"):
            return qs

        status_param = self.request.query_params.get("status")
        if status_param is not None:
            if status_param in ("1", "active", "true", "True"):
                return qs.filter(is_active=True)
            elif status_param in ("0", "inactive", "false", "False", "archived"):
                return qs.filter(is_active=False)
            elif status_param in ("all", "ALL"):
                return qs

        include_archived = self.request.query_params.get("include_archived")
        if include_archived in ("true", "1", "True"):
            return qs

        active_only = self.request.query_params.get("active_only")
        if active_only in ("true", "1", "True"):
            return qs.filter(is_active=True)
        if active_only in ("false", "0", "False"):
            return qs

        # Default for admin/owner: return all products so they can see and manage/unhide inactive ones
        return qs

