from django.conf import settings
from django.db import models


class Organization(models.Model):
    """
    Organization/workspace owned by an application user.

    The owner remains the primary account responsible for
    the organization. Additional users gain access through
    OrganizationUser memberships.
    """

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        # ================= FIX =================
        # Changed from "organization" to avoid conflict with User.organization
        related_name="owned_organization", 
        # =======================================
    )

    name = models.CharField(
        max_length=200,
    )

    code = models.CharField(
        max_length=30,
        unique=True,
    )

    email = models.EmailField()

    phone_number = models.CharField(
        max_length=30,
    )

    physical_address = models.TextField()

    website = models.URLField(
        blank=True,
    )

    logo = models.ImageField(
        upload_to="organizations/logos/",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.owner})"


class Permission(models.Model):
    """
    Global catalog of application capabilities.

    Permissions are grouped by module to support
    professional RBAC administration UIs.
    """

    code = models.CharField(
        max_length=100,
        unique=True,
    )

    name = models.CharField(
        max_length=150,
    )

    module = models.CharField(
        max_length=50,
        db_index=True,
    )

    description = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "module",
            "name",
        ]

    def __str__(self):
        return f"{self.module} - {self.name}"


class Role(models.Model):
    """
    Organization-scoped role.

    Different organizations may define roles with the same
    name while maintaining complete data isolation.
    """

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="roles",
    )

    name = models.CharField(
        max_length=100,
    )

    description = models.TextField(
        blank=True,
    )

    is_system_role = models.BooleanField(
        default=False,
    )

    permissions = models.ManyToManyField(
        Permission,
        through="RolePermission",
        related_name="roles",
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["name"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "organization",
                    "name",
                ],
                name="unique_role_name_per_organization",
            ),
        ]

    def __str__(self):
        return (
            f"{self.name} - "
            f"{self.organization.name}"
        )


class RolePermission(models.Model):
    """
    Explicit mapping between roles and permissions.

    This implements the many-to-many RBAC relationship
    requested by the system requirements.
    """

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="role_permissions",
    )

    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="role_permissions",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "role",
                    "permission",
                ],
                name="unique_permission_per_role",
            ),
        ]

    def __str__(self):
        return (
            f"{self.role.name} -> "
            f"{self.permission.code}"
        )


class OrganizationUser(models.Model):
    """
    Membership linking a user to an organization and role.

    Authentication identity remains on User.
    Authorization within an organization is determined
    through this membership and its assigned role.
    """

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="memberships",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization_memberships",
    )

    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name="memberships",
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["user__username"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "organization",
                    "user",
                ],
                name="unique_user_per_organization",
            ),
        ]

    def clean(self):
        """
        Prevent assigning a role belonging to another
        organization.
        """

        from django.core.exceptions import ValidationError

        if (
            self.role_id
            and self.organization_id
            and self.role.organization_id
            != self.organization_id
        ):
            raise ValidationError(
                {
                    "role": (
                        "The selected role does not belong "
                        "to this organization."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()

        return super().save(
            *args,
            **kwargs
        )

    def __str__(self):
        return (
            f"{self.user.username} - "
            f"{self.role.name} - "
            f"{self.organization.name}"
        )