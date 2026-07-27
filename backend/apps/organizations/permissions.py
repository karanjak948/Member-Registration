from rest_framework.permissions import (
    BasePermission,
)

from .services import OrganizationAccessService


class HasRBACPermission(BasePermission):
    """
    Generic DRF permission class for RBAC-protected endpoints.

    A view declares:

        required_permission = "approve_members"

    The permission is then checked against the authenticated
    user's active organization role.
    """

    message = (
        "You do not have permission to perform "
        "this action."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        user = request.user

        if not (
            user
            and user.is_authenticated
        ):
            return False

        required_permission = getattr(
            view,
            "required_permission",
            None,
        )

        if required_permission is None:
            return False

        return (
            OrganizationAccessService
            .has_permission(
                user,
                required_permission,
            )
        )


class HasActionRBACPermission(BasePermission):
    """
    Supports different permissions for different ViewSet actions.

    Example:

        permission_map = {
            "list": "view_members",
            "retrieve": "view_members",
            "create": "create_members",
            "update": "edit_members",
            "partial_update": "edit_members",
            "destroy": "delete_members",
            "approve": "approve_members",
        }
    """

    message = (
        "You do not have permission to perform "
        "this action."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        user = request.user

        if not (
            user
            and user.is_authenticated
        ):
            return False

        permission_map = getattr(
            view,
            "permission_map",
            {},
        )

        action = getattr(
            view,
            "action",
            None,
        )

        required_permission = (
            permission_map.get(action)
        )

        # Secure default:
        # an action without an explicit mapping is denied.
        if required_permission is None:
            return False

        return (
            OrganizationAccessService
            .has_permission(
                user,
                required_permission,
            )
        )


class IsOrganizationMember(BasePermission):
    """
    Requires an authenticated user to belong to an organization.

    Useful where access requires organization membership but
    does not require a specific granular permission.
    """

    message = (
        "You do not belong to an active organization."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return (
            OrganizationAccessService
            .get_organization(
                request.user
            )
            is not None
        )