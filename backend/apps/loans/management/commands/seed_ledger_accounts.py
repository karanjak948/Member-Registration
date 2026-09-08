from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.loans.models import (
    LedgerAccount,
    LedgerTransaction,
    AccountType,
    Loan,
    Repayment,
)
from apps.loans.services.accounting import (
    get_or_create_default_account,
    record_disbursement_journal,
    record_repayment_journal,
)
from apps.organizations.models import Organization


class Command(BaseCommand):
    help = "Seed standard SACCO Chart of Accounts and backfill general ledger journals for existing disbursed loans and repayments."

    def handle(self, *args, **options):
        org = Organization.objects.first()

        self.stdout.write("--- 1. Seeding Standard Chart of Accounts ---")
        standard_accounts = [
            ("1010", "Cash and Bank Balances", AccountType.ASSET),
            ("1200", "Loans Issued", AccountType.ASSET),
            ("2100", "Security deposits", AccountType.LIABILITY),
            ("2010", "Member Normal Savings", AccountType.LIABILITY),
            ("2020", "Member Welfare Contributions", AccountType.LIABILITY),
            ("2900", "Unallocated Member Deposits / Suspense", AccountType.LIABILITY),
            ("4000", "Interest earned", AccountType.REVENUE),
            ("4100", "Processing fees", AccountType.REVENUE),
            ("4150", "Form fees", AccountType.REVENUE),
            ("4200", "Penalties collected", AccountType.REVENUE),
            ("5000", "Loan Loss Provision Expense", AccountType.EXPENSE),
        ]

        accounts_created = 0
        for code, name, acct_type in standard_accounts:
            acct, created = LedgerAccount.objects.get_or_create(
                account_code=code,
                defaults={
                    "account_name": name,
                    "account_type": acct_type,
                    "organization": org,
                    "is_active": True,
                },
            )
            if created:
                accounts_created += 1
                self.stdout.write(self.style.SUCCESS(f"  Created account: {code} - {name}"))
            else:
                self.stdout.write(f"  Account exists: {code} - {name}")

        self.stdout.write(f"Chart of Accounts total: {LedgerAccount.objects.count()} accounts ({accounts_created} newly created).\n")

        self.stdout.write("--- 2. Backfilling Disbursement Journals for Existing Loans ---")
        disbursed_statuses = ["active", "closed", "watchful", "non_performing", "doubtful", "written_off"]
        loans = Loan.objects.filter(status__in=disbursed_statuses)

        disb_created = 0
        for loan in loans:
            existing = LedgerTransaction.objects.filter(
                reference_type="DISBURSEMENT",
                reference_id=loan.loan_number,
            ).first()

            if not existing:
                disbursement_date = loan.disbursement_date or loan.application_date or timezone.now().date()
                record_disbursement_journal(
                    loan=loan,
                    disbursement_date=disbursement_date,
                    disbursed_amount=loan.principal_amount,
                )
                disb_created += 1
                self.stdout.write(self.style.SUCCESS(f"  Created disbursement journal for loan: {loan.loan_number}"))
            else:
                self.stdout.write(f"  Disbursement journal exists for loan: {loan.loan_number}")

        self.stdout.write(f"Disbursement journals: {disb_created} backfilled.\n")

        self.stdout.write("--- 3. Backfilling Repayment Journals for Existing Repayments ---")
        repayments = Repayment.objects.all()
        repay_created = 0
        for r in repayments:
            existing = LedgerTransaction.objects.filter(
                reference_type="REPAYMENT",
                reference_id=r.repayment_number,
            ).first()

            if not existing:
                record_repayment_journal(r)
                repay_created += 1
                self.stdout.write(self.style.SUCCESS(f"  Created repayment journal: {r.repayment_number} for {r.loan.loan_number}"))
            else:
                self.stdout.write(f"  Repayment journal exists for: {r.repayment_number}")

        self.stdout.write(f"Repayment journals: {repay_created} backfilled.\n")

        total_txns = LedgerTransaction.objects.count()
        self.stdout.write(self.style.SUCCESS(f"Successfully finished! Total Ledger Transactions in database: {total_txns}."))
