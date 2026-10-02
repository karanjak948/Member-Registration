from django.conf import settings
from django.db import models
from django.utils import timezone


class AuditModel(models.Model):
    """
    Base model providing audit information.

    Business models should inherit from this class
    instead of redefining audit fields repeatedly.
    """

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="%(class)s_created",
        null=True,
        blank=True,
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="%(class)s_updated",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        abstract = True


class PaymentReversalLog(AuditModel):
    """
    Audit log of all reversed payments across Savings, Shares, and Loans.
    Maintains a tamper-proof historical record with snapshots.
    """
    class PaymentType(models.TextChoices):
        SAVINGS = "savings", "Savings Payment"
        SHARES = "shares", "Shares Payment"
        LOAN_REPAYMENT = "loan_repayment", "Loan Repayment"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="payment_reversals",
    )
    payment_type = models.CharField(
        max_length=30,
        choices=PaymentType.choices,
        db_index=True,
    )
    original_payment_id = models.CharField(
        max_length=100,
        db_index=True,
    )
    document_or_receipt_no = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_reversals",
    )
    amount_reversed = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    reversal_reason = models.TextField()
    reversed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_reversals",
    )
    reversed_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
    )
    snapshot_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Snapshot of payment details before reversal",
    )

    class Meta:
        db_table = "tbl_payment_reversal_logs"
        ordering = ["-reversed_at"]
        verbose_name = "Payment Reversal Log"
        verbose_name_plural = "Payment Reversal Logs"

    def __str__(self):
        return f"Reversal of {self.payment_type} #{self.document_or_receipt_no} - KES {self.amount_reversed}"