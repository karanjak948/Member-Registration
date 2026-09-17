from django.db import migrations

OPERATIONAL_PERMISSION_CODES = [
    # Members
    "view_members",
    "create_members",
    "edit_members",
    "complete_registration_members",
    # Jinue Loans
    "view_loan_products",
    "view_loans",
    "apply_loans",
    # Collections
    "view_collections",
    "receive_payments",
    "manage_reconciliation",
    "allocate_collections",
    # MPA / Savings
    "view_savings",
    "create_savings",
    "edit_savings",
    # Shares
    "view_shares",
    "create_shares",
    "edit_shares",
    # Finance
    "view_finance",
    "view_ledger",
    "post_journal_entry",
]


def assign_operational_permissions(apps, schema_editor):
    Permission = apps.get_model("organizations", "Permission")
    Role = apps.get_model("organizations", "Role")
    RolePermission = apps.get_model("organizations", "RolePermission")

    perms = list(Permission.objects.filter(code__in=OPERATIONAL_PERMISSION_CODES))
    officer_roles = Role.objects.filter(name__icontains="Member Officer")
    for role in officer_roles:
        for perm in perms:
            RolePermission.objects.get_or_create(role=role, permission=perm)


def reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0011_add_loan_finance_savings_permissions"),
    ]

    operations = [
        migrations.RunPython(assign_operational_permissions, reverse),
    ]
