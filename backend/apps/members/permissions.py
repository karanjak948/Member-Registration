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
    through their active organization role.
    """

    membership = get_user_organization_membership(
        user
    )

    if membership is None:
        return False

    return membership.role.permissions.filter(
        code=permission_code
    ).exists()


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

    Maps each DRF ViewSet action to the application
    permission required to perform that operation.
    """

    action_permissions = {
        "list": "view_members",
        "retrieve": "view_members",

        "create": "create_members",

        "update": "edit_members",
        "partial_update": "edit_members",

        "destroy": "delete_members",

        "approve": "approve_members",
        "reject": "approve_members",

        "activate": "activate_members",
        "deactivate": "deactivate_members",

        # Conversion modifies an existing member and
        # currently has no dedicated RBAC capability.
        "convert": "edit_members",
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

        required_permission = (
            self.action_permissions.get(
                getattr(
                    view,
                    "action",
                    None,
                )
            )
        )

        # Fail closed.
        #
        # Any new MemberViewSet action must be explicitly
        # added to action_permissions before it becomes
        # accessible.
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