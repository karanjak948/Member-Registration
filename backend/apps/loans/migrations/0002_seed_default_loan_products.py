from decimal import Decimal
from django.db import migrations


def seed_loan_products(apps, schema_editor):
    LoanProduct = apps.get_model("loans", "LoanProduct")
    LoanProductFee = apps.get_model("loans", "LoanProductFee")
    Organization = apps.get_model("organizations", "Organization")

    org = Organization.objects.first()

    products_data = [
        {
            "product_code": "DEV-001",
            "product_name": "Development Loan",
            "interest_method": "reducing_balance",
            "interest_rate": Decimal("12.0000"),
            "interest_period": "yearly",
            "repayment_frequency": "monthly",
            "min_repayment_period": 6,
            "max_repayment_period": 36,
            "min_amount": Decimal("50000.00"),
            "max_amount": Decimal("2000000.00"),
            "requires_guarantor": True,
            "min_guarantors": 2,
            "is_multiple_of_savings": True,
            "savings_multiplier": Decimal("3.0000"),
            "requires_security": False,
            "effective_date": "2026-01-01",
            "is_active": True,
            "allocation_order": "penalty,fees,interest,principal",
            "fees": [
                {
                    "fee_name": "Processing Fee",
                    "fee_type": "percentage",
                    "fee_value": Decimal("2.5000"),
                    "fee_basis": "principal",
                    "show_in_statement": True,
                    "ledger_account_name": "Loan Processing Fee Income",
                }
            ],
        },
        {
            "product_code": "EMG-001",
            "product_name": "Emergency Loan",
            "interest_method": "reducing_balance",
            "interest_rate": Decimal("15.0000"),
            "interest_period": "yearly",
            "repayment_frequency": "monthly",
            "min_repayment_period": 1,
            "max_repayment_period": 12,
            "min_amount": Decimal("5000.00"),
            "max_amount": Decimal("100000.00"),
            "requires_guarantor": True,
            "min_guarantors": 1,
            "is_multiple_of_savings": False,
            "requires_security": False,
            "effective_date": "2026-01-01",
            "is_active": True,
            "allocation_order": "penalty,fees,interest,principal",
            "fees": [
                {
                    "fee_name": "Processing Fee",
                    "fee_type": "percentage",
                    "fee_value": Decimal("1.5000"),
                    "fee_basis": "principal",
                    "show_in_statement": True,
                    "ledger_account_name": "Loan Processing Fee Income",
                }
            ],
        },
        {
            "product_code": "SCH-001",
            "product_name": "School Fees Loan",
            "interest_method": "reducing_balance",
            "interest_rate": Decimal("12.0000"),
            "interest_period": "yearly",
            "repayment_frequency": "monthly",
            "min_repayment_period": 3,
            "max_repayment_period": 12,
            "min_amount": Decimal("10000.00"),
            "max_amount": Decimal("300000.00"),
            "requires_guarantor": False,
            "min_guarantors": 0,
            "is_multiple_of_savings": False,
            "requires_security": False,
            "effective_date": "2026-01-01",
            "is_active": True,
            "allocation_order": "penalty,fees,interest,principal",
            "fees": [],
        },
        {
            "product_code": "AST-001",
            "product_name": "Asset Finance Loan",
            "interest_method": "reducing_balance",
            "interest_rate": Decimal("14.0000"),
            "interest_period": "yearly",
            "repayment_frequency": "monthly",
            "min_repayment_period": 12,
            "max_repayment_period": 48,
            "min_amount": Decimal("100000.00"),
            "max_amount": Decimal("5000000.00"),
            "requires_guarantor": False,
            "min_guarantors": 0,
            "is_multiple_of_savings": False,
            "requires_security": True,
            "security_type": "fixed_amount",
            "effective_date": "2026-01-01",
            "is_active": True,
            "allocation_order": "penalty,fees,interest,principal",
            "fees": [],
        },
        {
            "product_code": "INST-001",
            "product_name": "Instant Mobile Loan",
            "interest_method": "flat",
            "interest_rate": Decimal("5.0000"),
            "interest_period": "monthly",
            "repayment_frequency": "monthly",
            "min_repayment_period": 1,
            "max_repayment_period": 3,
            "min_amount": Decimal("1000.00"),
            "max_amount": Decimal("50000.00"),
            "requires_guarantor": False,
            "min_guarantors": 0,
            "is_multiple_of_savings": False,
            "requires_security": False,
            "effective_date": "2026-01-01",
            "is_active": True,
            "allocation_order": "penalty,fees,interest,principal",
            "fees": [],
        },
    ]

    for pdata in products_data:
        fees_data = pdata.pop("fees", [])
        code = pdata["product_code"]

        product, _ = LoanProduct.objects.get_or_create(
            product_code=code,
            defaults={**pdata, "organization": org},
        )

        for fee_data in fees_data:
            LoanProductFee.objects.get_or_create(
                product=product,
                fee_name=fee_data["fee_name"],
                defaults=fee_data,
            )


def reverse_func(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('loans', '0001_initial'),
        ('organizations', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_loan_products, reverse_func),
    ]
