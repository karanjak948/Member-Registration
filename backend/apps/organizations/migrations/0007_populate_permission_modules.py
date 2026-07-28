from django.db import migrations


PERMISSION_MODULES = {
    "view_members": "Members",
    "create_members": "Members",
    "edit_members": "Members",
    "delete_members": "Members",
    "approve_members": "Members",
    "activate_members": "Members",
    "deactivate_members": "Members",

    "manage_roles": "Roles",

    "manage_users": "Users",
}


def populate_modules(apps, schema_editor):
    Permission = apps.get_model(
        "organizations",
        "Permission",
    )

    for code, module in PERMISSION_MODULES.items():
        Permission.objects.filter(
            code=code
        ).update(
            module=module
        )


def reverse(apps, schema_editor):
    Permission = apps.get_model(
        "organizations",
        "Permission",
    )

    Permission.objects.update(
        module=None
    )


class Migration(migrations.Migration):

    dependencies = [
        (
            "organizations",
            "0006_alter_permission_options_permission_module",
        ),
    ]

    operations = [
        migrations.RunPython(
            populate_modules,
            reverse,
        ),
    ]