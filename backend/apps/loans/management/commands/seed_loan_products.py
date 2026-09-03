from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.loans.models import (
    LoanProduct,
    LoanProductFee,
    InterestMethod,
    InterestPeriod,
    RepaymentFrequency,
    SecurityType,
    FeeType,
)
from apps.organizations.models import Organization


class Command(BaseCommand):
    help = "Seed default SACCO loan product tiers (Development, Emergency, School Fees, Asset Finance, Instant Mobile)."

    def handle(self, *args, **options):
        org = Organization.objects.first()

        products_data = [
            {
                "product_code": "DEV-001",
                "product_name": "Development Loan",
                "interest_method": InterestMethod.REDUCING_BALANCE,
                "interest_rate": Decimal("12.0000"),
                "interest_period": InterestPeriod.YEARLY,
                "repayment_frequency": RepaymentFrequency.MONTHLY,
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
                        "fee_type": FeeType.PERCENTAGE,
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
                "interest_method": InterestMethod.REDUCING_BALANCE,
                "interest_rate": Decimal("15.0000"),
                "interest_period": InterestPeriod.YEARLY,
                "repayment_frequency": RepaymentFrequency.MONTHLY,
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
                        "fee_type": FeeType.PERCENTAGE,
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
                "interest_method": InterestMethod.REDUCING_BALANCE,
                "interest_rate": Decimal("12.0000"),
                "interest_period": InterestPeriod.YEARLY,
                "repayment_frequency": RepaymentFrequency.MONTHLY,
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
                "interest_method": InterestMethod.REDUCING_BALANCE,
                "interest_rate": Decimal("14.0000"),
                "interest_period": InterestPeriod.YEARLY,
                "repayment_frequency": RepaymentFrequency.MONTHLY,
                "min_repayment_period": 12,
                "max_repayment_period": 48,
                "min_amount": Decimal("100000.00"),
                "max_amount": Decimal("5000000.00"),
                "requires_guarantor": False,
                "min_guarantors": 0,
                "is_multiple_of_savings": False,
                "requires_security": True,
                "security_type": SecurityType.FIXED_AMOUNT,
                "effective_date": "2026-01-01",
                "is_active": True,
                "allocation_order": "penalty,fees,interest,principal",
                "fees": [],
            },
            {
                "product_code": "INST-001",
                "product_name": "Instant Mobile Loan",
                "interest_method": InterestMethod.FLAT,
                "interest_rate": Decimal("5.0000"),
                "interest_period": InterestPeriod.MONTHLY,
                "repayment_frequency": RepaymentFrequency.MONTHLY,
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

        created_count = 0
        for pdata in products_data:
            fees_data = pdata.pop("fees", [])
            code = pdata["product_code"]

            product, created = LoanProduct.objects.get_or_create(
                product_code=code,
                defaults={**pdata, "organization": org},
            )

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created loan product: {product.product_name} ({code})"))
            else:
                self.stdout.write(f"Loan product already exists: {product.product_name} ({code})")

            for fee_data in fees_data:
                LoanProductFee.objects.get_or_create(
                    product=product,
                    fee_name=fee_data["fee_name"],
                    defaults=fee_data,
                )

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} loan products."))
