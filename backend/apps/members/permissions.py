from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
)


class IsAuthenticatedUser(BasePermission):
    """
    Permission for user-owned business data.

    Any authenticated application user may perform CRUD
    operations. Data ownership/isolation is enforced by
    each ViewSet's get_queryset() and serializer validation.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Permission for shared system/reference data.

    Authenticated users may read shared configuration.
    Only staff users may modify it.
    """

    def has_permission(self, request, view):
        if not (
            request.user
            and request.user.is_authenticated
        ):
            return False

        if request.method in SAFE_METHODS:
            return True

        return request.user.is_staff