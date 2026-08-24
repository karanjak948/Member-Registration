from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
)

from apps.organizations.models import (
    OrganizationUser,
)


def get_user_organization_membership(user):
    """
    Resolve the authenticated user's active organization
    membership.

    Organization owners are also expected to have an
    OrganizationUser membership with the Owner system role,
    created during RBAC bootstrap.

    Returns None when the user has no active organization
    membership.
    """

    if not (
        user
        and user.is_authenticated
    ):
        return None

    return (
        OrganizationUser.objects
        .select_related(
            "organization",
            "role",
        )
        .prefetch_related(
            "role__permissions",
        )
        .filter(
            user=user,
            is_active=True,
        )
        .first()
    )


def user_has_organization_permission(
    user,
    permission_code,
):
    """
    Check whether an authenticated user has a permission
    through their active organization role or administrative status.
    """
    if not (
        user
        and user.is_authenticated
    ):
        return False

    if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
        return True

    # Check if user is the organization owner
    try:
        if hasattr(user, "organization") and user.organization:
            return True
    except Exception:
        pass

    membership = get_user_organization_membership(
        user
    )

    if membership is None:
        return False

    if membership.role:
        role_name = (membership.role.name or "").lower()
        if (
            getattr(membership.role, "is_system_role", False)
            or role_name in ["owner", "administrator", "admin", "system administrator"]
        ):
            return True

        if membership.role.permissions.filter(code=permission_code).exists():
            return True

    return False


class IsAuthenticatedUser(BasePermission):
    """
    Basic authentication permission.

    This class remains available for endpoints that only
    require authentication and do not require a specific
    organization capability.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
        )


class HasMemberPermission(BasePermission):
    """
    Organization-scoped RBAC permission for MemberViewSet.
    """

    action_permissions = {
        # Read
        "list": "view_members",
        "retrieve": "view_members",

        # CRUD
        "create": "create_members",
        "update": "edit_members",
        "partial_update": "edit_members",
        "destroy": "delete_members",

        # Workflow
        "approve": "approve_members",
        "reject": "reject_members",

        "activate": "activate_members",
        "deactivate": "deactivate_members",

        "bulk_activate": "activate_members",
        "bulk_deactivate": "deactivate_members",

        "complete_registration":
            "complete_registration_members",
    }

    message = (
        "You do not have permission to perform "
        "this member operation."
    )

    def has_permission(self, request, view):
        user = request.user

        if not (
            user
            and user.is_authenticated
        ):
            return False

        required_permission = self.action_permissions.get(
            getattr(view, "action", None)
        )

        if required_permission is None:
            return False

        return user_has_organization_permission(
            user=user,
            permission_code=required_permission,
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Permission for shared system/reference data.

    Authenticated users may read shared configuration.
    Only staff users may modify it.

    This is retained for existing reference/configuration
    endpoints. Organization-scoped business endpoints
    should use RBAC-specific permissions instead.
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