from django.db import migrations


def add_loan_finance_savings_permissions(apps, schema_editor):
    Permission = apps.get_model("organizations", "Permission")
    Role = apps.get_model("organizations", "Role")
    RolePermission = apps.get_model("organizations", "RolePermission")

    NEW_PERMISSIONS = [
        # Loans Module
        {
            "code": "view_loans",
            "name": "View Loans",
            "module": "Loans",
            "description": "Can view loan applications, details, repayments, and schedules.",
        },
        {
            "code": "apply_loans",
            "name": "Apply Loans",
            "module": "Loans",
            "description": "Can submit new loan applications on behalf of members.",
        },
        {
            "code": "approve_loans",
            "name": "Approve Loans",
            "module": "Loans",
            "description": "Can approve loan applications and record approval decisions.",
        },
        {
            "code": "disburse_loans",
            "name": "Disburse Loans",
            "module": "Loans",
            "description": "Can disburse approved loans, specify disbursement channel, and generate schedule.",
        },
        {
            "code": "reject_loans",
            "name": "Reject Loans",
            "module": "Loans",
            "description": "Can reject loan applications.",
        },
        {
            "code": "delete_loans",
            "name": "Delete Loans",
            "module": "Loans",
            "description": "Can delete loan records.",
        },

        # Finance Module
        {
            "code": "view_finance",
            "name": "View Finance",
            "module": "Finance",
            "description": "Can access finance dashboard, metrics, and liquidity tracking.",
        },
        {
            "code": "view_ledger",
            "name": "View General Ledger",
            "module": "Finance",
            "description": "Can view general ledger transactions and double-entry journals.",
        },
        {
            "code": "manage_ledger_accounts",
            "name": "Manage Ledger Accounts",
            "module": "Finance",
            "description": "Can view and configure the SACCO chart of accounts.",
        },
        {
            "code": "post_journal_entry",
            "name": "Post Income & Journal Entries",
            "module": "Finance",
            "description": "Can post income transactions, fees, and general ledger journal entries.",
        },

        # Savings / MPA Module
        {
            "code": "view_savings",
            "name": "View Savings",
            "module": "Savings",
            "description": "Can view member savings payments, registers, and savings summaries.",
        },
        {
            "code": "create_savings",
            "name": "Create Savings Payment",
            "module": "Savings",
            "description": "Can record new member savings and welfare payments.",
        },
        {
            "code": "edit_savings",
            "name": "Edit Savings Payment",
            "module": "Savings",
            "description": "Can edit member savings and welfare records.",
        },
        {
            "code": "delete_savings",
            "name": "Delete Savings Payment",
            "module": "Savings",
            "description": "Can delete member savings payment records.",
        },
    ]

    created_permissions = []
    for item in NEW_PERMISSIONS:
        perm, _ = Permission.objects.get_or_create(
            code=item["code"],
            defaults={
                "name": item["name"],
                "module": item["module"],
                "description": item["description"],
            },
        )
        # In case it already existed without proper module
        if perm.module != item["module"]:
            perm.module = item["module"]
            perm.save(update_fields=["module"])
        created_permissions.append(perm)

    # Automatically grant all new permissions to system roles (Owner, Super Admin, etc.)
    system_roles = Role.objects.filter(is_system_role=True)
    for role in system_roles:
        for perm in created_permissions:
            RolePermission.objects.get_or_create(role=role, permission=perm)


def reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0010_alter_organization_owner"),
    ]

    operations = [
        migrations.RunPython(add_loan_finance_savings_permissions, reverse),
    ]
