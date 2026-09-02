from django.db import models
from django.conf import settings
from apps.common.models import AuditModel
from apps.loans.models.loan import Loan


class PaymentMethod(models.TextChoices):
    MPESA = "mpesa", "M-Pesa"
    BANK_TRANSFER = "bank_transfer", "Bank Transfer"
    CASH = "cash", "Cash"
    CHEQUE = "cheque", "Cheque"
    SAVINGS_OFFSET = "savings_offset", "Savings Offset"
    STANDING_ORDER = "standing_order", "Standing Order"


class Repayment(AuditModel):
    """
    Loan payment record with detailed component allocations.
    """
    repayment_number = models.CharField(max_length=50, unique=True, db_index=True)
    loan = models.ForeignKey(
        Loan, on_delete=models.PROTECT, related_name="repayments"
    )
    payment_date = models.DateField(db_index=True)
    amount_paid = models.DecimalField(max_digits=15, decimal_places=2)
    payment_method = models.CharField(
        max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.MPESA
    )
    transaction_reference = models.CharField(
        max_length=100, unique=True, db_index=True, help_text="e.g. M-Pesa Receipt / Bank Ref"
    )

    # Waterfall allocation breakdown
    allocated_principal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    allocated_interest = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    allocated_fees = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    allocated_penalty = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    unallocated_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recorded_repayments",
    )

    class Meta:
        db_table = "tbl_loan_repayments"
        ordering = ["-payment_date", "-created_at"]

    def __str__(self):
        return f"Repayment {self.repayment_number} ({self.amount_paid}) for {self.loan.loan_number}"
