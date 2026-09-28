from django.db import migrations


NEW_PERMISSIONS = [
    {
        "code": "view_loan_products",
        "name": "View Loan Products",
        "module": "Loans",
        "description": "Can open the Loan Products link in the sidebar and see the product list.",
    },
    {
        "code": "create_loan_products",
        "name": "Create Loan Products",
        "module": "Loans",
        "description": "Can open Create Loan Product and add a new product.",
    },
    {
        "code": "edit_loan_products",
        "name": "Edit Loan Products",
        "module": "Loans",
        "description": "Can edit an existing loan product.",
    },
    {
        "code": "delete_loan_products",
        "name": "Delete Loan Products",
        "module": "Loans",
        "description": "Can delete a loan product.",
    },
    {
        "code": "toggle_loan_products",
        "name": "Enable or Hide Loan Products",
        "module": "Loans",
        "description": "Can hide a loan product from the catalog and show it again.",
    },
]


def add_loan_product_permissions(apps, schema_editor):
    Permission = apps.get_model("organizations", "Permission")
    Role = apps.get_model("organizations", "Role")
    RolePermission = apps.get_model("organizations", "RolePermission")

    created = []
    for item in NEW_PERMISSIONS:
        perm, _ = Permission.objects.get_or_create(
            code=item["code"],
            defaults={
                "name": item["name"],
                "module": item["module"],
                "description": item["description"],
            },
        )
        updates = []
        if perm.module != item["module"]:
            perm.module = item["module"]
            updates.append("module")
        if perm.name != item["name"]:
            perm.name = item["name"]
            updates.append("name")
        if updates:
            perm.save(update_fields=updates)
        created.append(perm)

    system_roles = Role.objects.filter(is_system_role=True)
    for role in system_roles:
        for perm in created:
            RolePermission.objects.get_or_create(role=role, permission=perm)

    view_perm = next(perm for perm in created if perm.code == "view_loan_products")
    for role in Role.objects.filter(name__icontains="Member Officer"):
        RolePermission.objects.get_or_create(role=role, permission=view_perm)


def reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0012_assign_officer_operational_permissions"),
    ]

    operations = [
        migrations.RunPython(add_loan_product_permissions, reverse),
    ]
