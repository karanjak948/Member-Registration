from django.db import models
from django.conf import settings
from apps.common.models import AuditModel


class AccountType(models.TextChoices):
    ASSET = "asset", "Asset"
    LIABILITY = "liability", "Liability"
    EQUITY = "equity", "Equity"
    REVENUE = "revenue", "Revenue / Income"
    EXPENSE = "expense", "Expense"


class LedgerAccount(AuditModel):
    """
    Chart of Accounts definition for loan accounting.
    """
    account_code = models.CharField(max_length=50, unique=True, db_index=True)
    account_name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=30, choices=AccountType.choices)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="ledger_accounts",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "tbl_ledger_accounts"
        ordering = ["account_code"]

    def __str__(self):
        return f"{self.account_code} - {self.account_name} ({self.get_account_type_display()})"


class LedgerTransaction(AuditModel):
    """
    Double-entry accounting transaction header (Journal Entry).
    """
    transaction_number = models.CharField(max_length=50, unique=True, db_index=True)
    transaction_date = models.DateField(db_index=True)
    description = models.TextField()
    reference_type = models.CharField(
        max_length=50,
        help_text="DISBURSEMENT | REPAYMENT | FEE | PENALTY | WRITE_OFF | RESCHEDULE",
        db_index=True,
    )
    reference_id = models.CharField(max_length=100, blank=True, null=True)
    loan = models.ForeignKey(
        "loans.Loan",
        on_delete=models.SET_NULL,
        related_name="ledger_transactions",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "tbl_ledger_transactions"
        ordering = ["-transaction_date", "-created_at"]

    def __str__(self):
        return f"{self.transaction_number} - {self.reference_type} on {self.transaction_date}"


class LedgerEntry(models.Model):
    """
    Individual debit/credit line item for a double-entry transaction.
    Debits must equal Credits for every transaction.
    """
    class EntryType(models.TextChoices):
        DEBIT = "debit", "Debit"
        CREDIT = "credit", "Credit"

    transaction = models.ForeignKey(
        LedgerTransaction, on_delete=models.CASCADE, related_name="entries"
    )
    account = models.ForeignKey(
        LedgerAccount, on_delete=models.PROTECT, related_name="entries"
    )
    entry_type = models.CharField(max_length=10, choices=EntryType.choices)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    narration = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "tbl_ledger_entries"

    def __str__(self):
        return f"{self.get_entry_type_display()} {self.amount} -> {self.account.account_name}"
