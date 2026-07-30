from django.db import migrations


def add_member_workflow_permissions(apps, schema_editor):
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

    workflow_permissions = [
        {
            "code": "reject_members",
            "name": "Reject Members",
            "module": "members",
            "description": (
                "Can reject member registrations."
            ),
        },
        {
            "code": "complete_registration_members",
            "name": "Complete Registration",
            "module": "members",
            "description": (
                "Can complete member registration "
                "(APPROVED → ACTIVE)."
            ),
        },
    ]

    permissions = []

    for permission_data in workflow_permissions:
        permission, _ = Permission.objects.get_or_create(
            code=permission_data["code"],
            defaults={
                "name": permission_data["name"],
                "module": permission_data["module"],
                "description": permission_data["description"],
            },
        )

        permissions.append(permission)

    owner_roles = Role.objects.filter(
        is_system_role=True,
    )

    for role in owner_roles:
        for permission in permissions:
            RolePermission.objects.get_or_create(
                role=role,
                permission=permission,
            )


def reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        (
            "organizations",
            "0008_alter_permission_module",
        ),
    ]

    operations = [
        migrations.RunPython(
            add_member_workflow_permissions,
            reverse,
        ),
    ]