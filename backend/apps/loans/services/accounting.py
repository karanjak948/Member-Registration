"""
Accounting & General Ledger posting service.
Handles automatic double-entry journal transactions for:
- Loan Disbursement (DR Loan Portfolio Asset, CR Cash/Bank/Mpesa Asset, CR Fee Income)
- Repayment Receipt (DR Cash/Bank/Mpesa Asset, CR Loan Portfolio Asset, CR Interest Income, CR Fee/Penalty Income)
- Penalty Accrual (DR Penalty Receivable Asset, CR Penalty Income)
- Loan Write-off (DR Loan Loss Expense, CR Loan Portfolio Asset)
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from django.db import transaction
from apps.loans.models import (
    LedgerAccount,
    LedgerTransaction,
    LedgerEntry,
    AccountType,
    Loan,
    Repayment,
)
from apps.loans.services.engine.interest import round2


def get_or_create_default_account(
    account_code: str, account_name: str, account_type: AccountType, organization=None
) -> LedgerAccount:
    """Retrieve or create standard ledger accounts."""
    account, _ = LedgerAccount.objects.get_or_create(
        account_code=account_code,
        defaults={
            "account_name": account_name,
            "account_type": account_type,
            "organization": organization,
            "is_active": True,
        },
    )
    return account


@transaction.atomic
def record_disbursement_journal(
    loan: Loan,
    disbursement_date: date,
    disbursed_amount: Decimal,
    fee_deductions: Decimal = Decimal("0.00"),
    payout_account_code: str = "1010",  # Cash / Bank / Mpesa Asset
) -> LedgerTransaction:
    """
    Record loan disbursement double-entry:
      DR: Loan Portfolio Asset (Full Principal)
      CR: Cash/Bank Account (Net Payout = Principal - Upfront Fees)
      CR: Fee Income Account (if any upfront fees deducted)
    """
    org = loan.organization
    portfolio_acct = get_or_create_default_account(
        "1200", "Loan Portfolio Receivable", AccountType.ASSET, org
    )
    payout_acct = get_or_create_default_account(
        payout_account_code, "Cash and Bank Balances", AccountType.ASSET, org
    )
    fee_acct = get_or_create_default_account(
        "4100", "Loan Processing Fee Income", AccountType.REVENUE, org
    )

    principal = round2(loan.principal_amount)
    fees = round2(fee_deductions)
    net_payout = round2(principal - fees)

    txn = LedgerTransaction.objects.create(
        transaction_number=f"TXN-DISB-{loan.loan_number}",
        transaction_date=disbursement_date,
        description=f"Disbursement for Loan {loan.loan_number} ({loan.member})",
        reference_type="DISBURSEMENT",
        reference_id=loan.loan_number,
        loan=loan,
    )

    # Debit Loan Portfolio Asset
    LedgerEntry.objects.create(
        transaction=txn,
        account=portfolio_acct,
        entry_type=LedgerEntry.EntryType.DEBIT,
        amount=principal,
        narration=f"Principal disbursed for {loan.loan_number}",
    )

    # Credit Cash/Bank
    LedgerEntry.objects.create(
        transaction=txn,
        account=payout_acct,
        entry_type=LedgerEntry.EntryType.CREDIT,
        amount=net_payout,
        narration=f"Net payout for {loan.loan_number}",
    )

    # Credit Fee Income if deducted
    if fees > Decimal("0.00"):
        LedgerEntry.objects.create(
            transaction=txn,
            account=fee_acct,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount=fees,
            narration=f"Upfront fees for {loan.loan_number}",
        )

    return txn


@transaction.atomic
def record_repayment_journal(
    repayment: Repayment,
    receiving_account_code: str = "1010",
) -> LedgerTransaction:
    """
    Record repayment double-entry:
      DR: Cash/Bank/Mpesa Asset (Total Paid)
      CR: Loan Portfolio Asset (Principal Portion)
      CR: Interest Income (Interest Portion)
      CR: Penalty Income (Penalty Portion)
      CR: Fee Income (Fee Portion)
      CR: Suspense / Unallocated Liability (Excess Portion)
    """
    loan = repayment.loan
    org = loan.organization

    cash_acct = get_or_create_default_account(
        receiving_account_code, "Cash and Bank Balances", AccountType.ASSET, org
    )
    portfolio_acct = get_or_create_default_account(
        "1200", "Loan Portfolio Receivable", AccountType.ASSET, org
    )
    interest_acct = get_or_create_default_account(
        "4000", "Interest Income on Loans", AccountType.REVENUE, org
    )
    penalty_acct = get_or_create_default_account(
        "4200", "Penalty Income", AccountType.REVENUE, org
    )
    fee_acct = get_or_create_default_account(
        "4100", "Loan Fee Income", AccountType.REVENUE, org
    )
    suspense_acct = get_or_create_default_account(
        "2900", "Unallocated Member Deposits / Suspense", AccountType.LIABILITY, org
    )

    total_paid = round2(repayment.amount_paid)

    txn = LedgerTransaction.objects.create(
        transaction_number=f"TXN-RPY-{repayment.repayment_number}",
        transaction_date=repayment.payment_date,
        description=f"Repayment {repayment.repayment_number} for Loan {loan.loan_number} via {repayment.get_payment_method_display()}",
        reference_type="REPAYMENT",
        reference_id=repayment.repayment_number,
        loan=loan,
    )

    # Debit Cash / Bank
    LedgerEntry.objects.create(
        transaction=txn,
        account=cash_acct,
        entry_type=LedgerEntry.EntryType.DEBIT,
        amount=total_paid,
        narration=f"Received payment {repayment.transaction_reference}",
    )

    # Credit Principal
    if repayment.allocated_principal > Decimal("0.00"):
        LedgerEntry.objects.create(
            transaction=txn,
            account=portfolio_acct,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount=repayment.allocated_principal,
            narration=f"Principal reduction for {loan.loan_number}",
        )

    # Credit Interest Income
    if repayment.allocated_interest > Decimal("0.00"):
        LedgerEntry.objects.create(
            transaction=txn,
            account=interest_acct,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount=repayment.allocated_interest,
            narration=f"Interest income on {loan.loan_number}",
        )

    # Credit Penalty Income
    if repayment.allocated_penalty > Decimal("0.00"):
        LedgerEntry.objects.create(
            transaction=txn,
            account=penalty_acct,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount=repayment.allocated_penalty,
            narration=f"Penalty income on {loan.loan_number}",
        )

    # Credit Fee Income
    if repayment.allocated_fees > Decimal("0.00"):
        LedgerEntry.objects.create(
            transaction=txn,
            account=fee_acct,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount=repayment.allocated_fees,
            narration=f"Fee recovery on {loan.loan_number}",
        )

    # Credit Unallocated
    if repayment.unallocated_amount > Decimal("0.00"):
        LedgerEntry.objects.create(
            transaction=txn,
            account=suspense_acct,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount=repayment.unallocated_amount,
            narration=f"Unallocated overpayment for {loan.loan_number}",
        )

    return txn
