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

        # 1. Direct ForeignKey on User
        if hasattr(user, "organization") and user.organization:
            return user.organization

        # 2. Organization owner
        if hasattr(user, "owned_organization"):
            try:
                if user.owned_organization:
                    return user.owned_organization
            except (Organization.DoesNotExist, AttributeError):
                pass

        owner_org = (
            Organization.objects
            .filter(owner=user)
            .first()
        )
        if owner_org:
            return owner_org

        # 3. Role-assigned organization user.
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

        if membership is not None:
            return membership.organization

        # 4. Superuser / Staff fallback to primary organization if present
        if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
            return Organization.objects.first()

        return None

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

        if hasattr(user, "owned_organization"):
            try:
                if user.owned_organization:
                    return True
            except (Organization.DoesNotExist, AttributeError):
                pass

        if Organization.objects.filter(owner=user).exists():
            return True

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

    @classmethod
    def bootstrap_organization(cls, organization, owner_user):
        """
        Bootstrap roles, permissions, and owner membership for an organization.
        """
        from .models import Permission, Role, OrganizationUser

        if not organization:
            return

        # 1. Update owner user
        if owner_user:
            owner_user.organization = organization
            owner_user.is_staff = True
            owner_user.save(update_fields=["organization", "is_staff"])

        # 2. Get or create Owner role
        owner_role, _ = Role.objects.get_or_create(
            organization=organization,
            name="Owner",
            defaults={
                "description": "System role with full access to the organization.",
                "is_system_role": True,
            },
        )
        # Assign all permissions to Owner role
        all_permissions = Permission.objects.all()
        if all_permissions.exists():
            owner_role.permissions.set(all_permissions)

        # 3. Create default Member Officer role if not exists
        Role.objects.get_or_create(
            organization=organization,
            name="Member Officer",
            defaults={
                "description": "Standard operational role for member management.",
                "is_system_role": False,
            },
        )

        # 4. Create OrganizationUser membership for owner
        if owner_user:
            OrganizationUser.objects.update_or_create(
                user=owner_user,
                organization=organization,
                defaults={
                    "role": owner_role,
                    "is_active": True,
                },
            )