from django.db import migrations


INITIAL_PERMISSIONS = [
    (
        "view_members",
        "View Members",
        "View member records.",
    ),
    (
        "create_members",
        "Create Members",
        "Register new members.",
    ),
    (
        "edit_members",
        "Edit Members",
        "Update existing member records.",
    ),
    (
        "delete_members",
        "Delete Members",
        "Delete member records.",
    ),
    (
        "approve_members",
        "Approve Members",
        "Approve submitted member registrations.",
    ),
    (
        "activate_members",
        "Activate Members",
        "Activate approved members.",
    ),
    (
        "deactivate_members",
        "Deactivate Members",
        "Deactivate active members.",
    ),
    (
        "manage_roles",
        "Manage Roles",
        "Create, update, and manage roles and role permissions.",
    ),
    (
        "manage_users",
        "Manage Users",
        "Create and manage organization users and assign roles.",
    ),
]


def bootstrap_rbac(apps, schema_editor):
    Permission = apps.get_model(
        "organizations",
        "Permission",
    )
    Role = apps.get_model(
        "organizations",
        "Role",
    )
    RolePermission = apps.get_model(
        "organizations",
        "RolePermission",
    )
    Organization = apps.get_model(
        "organizations",
        "Organization",
    )
    OrganizationUser = apps.get_model(
        "organizations",
        "OrganizationUser",
    )

    # --------------------------------------------------------
    # 1. Seed the global permission catalogue
    # --------------------------------------------------------

    permissions = []

    for code, name, description in INITIAL_PERMISSIONS:
        permission, _ = Permission.objects.get_or_create(
            code=code,
            defaults={
                "name": name,
                "description": description,
            },
        )

        permissions.append(permission)

    # --------------------------------------------------------
    # 2. Bootstrap every existing organization
    # --------------------------------------------------------

    for organization in Organization.objects.all():
        owner_role, _ = Role.objects.get_or_create(
            organization=organization,
            name="Owner",
            defaults={
                "description": (
                    "System role with full access to "
                    "the organization."
                ),
                "is_system_role": True,
            },
        )

        # Ensure an existing Owner role is also recognized
        # as a protected system role.
        if not owner_role.is_system_role:
            owner_role.is_system_role = True
            owner_role.save(
                update_fields=[
                    "is_system_role",
                ]
            )

        # ----------------------------------------------------
        # 3. Give Owner every initial permission
        # ----------------------------------------------------

        for permission in permissions:
            RolePermission.objects.get_or_create(
                role=owner_role,
                permission=permission,
            )

        # ----------------------------------------------------
        # 4. Assign the existing organization owner
        #    to the Owner role
        # ----------------------------------------------------

        OrganizationUser.objects.update_or_create(
            organization=organization,
            user_id=organization.owner_id,
            defaults={
                "role": owner_role,
                "is_active": True,
            },
        )


def reverse_bootstrap_rbac(apps, schema_editor):
    """
    Intentionally preserve RBAC data on reverse migration.

    Automatically deleting roles, permissions, or user-role
    assignments could destroy authorization data created after
    the migration was initially applied.
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        (
            "organizations",
            "0004_permission_role_rolepermission_role_permissions_and_more",
        ),
    ]

    operations = [
        migrations.RunPython(
            bootstrap_rbac,
            reverse_bootstrap_rbac,
        ),
    ]