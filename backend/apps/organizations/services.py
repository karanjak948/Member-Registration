from typing import Optional

from .models import (
    Organization,
    OrganizationUser,
)


class OrganizationAccessService:
    """
    Central service for resolving organization membership
    and RBAC permissions.

    Supports:
    1. Organization owners.
    2. Users assigned through OrganizationUser.

    Authorization logic should use this service rather than
    relying directly on user.is_staff.
    """

    @staticmethod
    def get_organization(user) -> Optional[Organization]:
        """
        Resolve the active organization for a user.

        The organization owner is resolved first. Otherwise,
        an active OrganizationUser membership is used.
        """

        if not (
            user
            and user.is_authenticated
        ):
            return None

        # Organization owner.
        try:
            return user.organization
        except Organization.DoesNotExist:
            pass

        # Role-assigned organization user.
        membership = (
            OrganizationUser.objects
            .select_related(
                "organization",
                "role",
            )
            .filter(
                user=user,
                is_active=True,
            )
            .first()
        )

        if membership is None:
            return None

        return membership.organization

    @staticmethod
    def get_membership(user) -> Optional[OrganizationUser]:
        """
        Return the user's active OrganizationUser membership.

        Existing organization owners were bootstrapped into
        OrganizationUser by migration 0005, so owners normally
        have a membership as well.
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

    @classmethod
    def get_role(cls, user):
        """
        Return the user's active organization role.
        """

        membership = cls.get_membership(
            user
        )

        if membership is None:
            return None

        return membership.role

    @classmethod
    def get_permission_codes(cls, user) -> set[str]:
        """
        Return all permission codes granted through the
        user's active role.
        """

        membership = cls.get_membership(
            user
        )

        if membership is None:
            return set()

        return set(
            membership.role.permissions.values_list(
                "code",
                flat=True,
            )
        )

    @classmethod
    def has_permission(
        cls,
        user,
        permission_code: str,
    ) -> bool:
        """
        Check whether a user has a specific RBAC permission.
        """

        if not (
            user
            and user.is_authenticated
        ):
            return False

        if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
            return True

        if not permission_code:
            return False

        try:
            if hasattr(user, "organization") and user.organization:
                return True
        except Exception:
            pass

        membership = cls.get_membership(
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

            return (
                membership.role.permissions
                .filter(
                    code=permission_code
                )
                .exists()
            )

        return False

    @classmethod
    def has_any_permission(
        cls,
        user,
        permission_codes,
    ) -> bool:
        """
        Check whether the user has at least one permission
        from the supplied collection.
        """

        permission_codes = set(
            permission_codes or []
        )

        if not permission_codes:
            return False

        user_permissions = (
            cls.get_permission_codes(user)
        )

        return bool(
            user_permissions
            & permission_codes
        )

    @classmethod
    def has_all_permissions(
        cls,
        user,
        permission_codes,
    ) -> bool:
        """
        Check whether the user has every supplied permission.
        """

        permission_codes = set(
            permission_codes or []
        )

        if not permission_codes:
            return True

        user_permissions = (
            cls.get_permission_codes(user)
        )

        return permission_codes.issubset(
            user_permissions
        )