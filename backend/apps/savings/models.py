from uuid import uuid4
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.common.models import AuditModel


class SavingsPayment(AuditModel):
    """
    Savings payment transaction record for Member Personal Account (MPA).
    Supports Normal savings and Welfare contributions.
    """
    class SavingsType(models.TextChoices):
        NORMAL = "normal", "Normal"
        WELFARE = "welfare", "Welfare ksh"

    class TransactionType(models.TextChoices):
        MONEY_IN = "money_in", "Money In"
        MONEY_OUT = "money_out", "Money Out"

    class PaymentMode(models.TextChoices):
        MPESA = "mpesa", "M-pesa"
        CASH = "cash", "Cash"
        BANK = "bank", "Bank"
        CHEQUE = "cheque", "Cheque"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="savings_payments",
    )
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.PROTECT,
        related_name="savings_payments",
    )
    document_no = models.CharField(
        max_length=100,
        db_index=True,
    )
    savings_type = models.CharField(
        max_length=30,
        choices=SavingsType.choices,
        default=SavingsType.NORMAL,
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices,
        default=TransactionType.MONEY_IN,
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    currency = models.CharField(
        max_length=50,
        default="Kenya Shilling(KSH)",
    )
    payment_mode = models.CharField(
        max_length=30,
        choices=PaymentMode.choices,
        default=PaymentMode.MPESA,
    )
    bank_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )
    transaction_no = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        db_index=True,
    )
    paid_on = models.DateField(
        default=timezone.now,
    )
    paid_by = models.CharField(
        max_length=200,
        blank=True,
        null=True,
    )
    week = models.PositiveSmallIntegerField(
        blank=True,
        null=True,
    )
    month = models.PositiveSmallIntegerField(
        blank=True,
        null=True,
    )
    year = models.PositiveIntegerField(
        blank=True,
        null=True,
    )
    remarks = models.TextField(
        blank=True,
        null=True,
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recorded_savings_payments",
    )

    class Meta:
        db_table = "tbl_savings_payments"
        ordering = ["-paid_on", "-created_at"]
        verbose_name = "Savings Payment"
        verbose_name_plural = "Savings Payments"

    def save(self, *args, **kwargs):
        if not self.document_no:
            # Generate sequential/formatted document number
            last_id = SavingsPayment.objects.aggregate(max_id=models.Max("id"))["max_id"] or 0
            self.document_no = f"{last_id + 1}"

        if not self.paid_on:
            self.paid_on = timezone.now().date()

        if self.month is None and self.paid_on:
            self.month = self.paid_on.month

        if self.year is None and self.paid_on:
            self.year = self.paid_on.year

        if self.week is None and self.paid_on:
            day = self.paid_on.day
            self.week = min(5, ((day - 1) // 7) + 1)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.document_no} - {self.member.full_name} ({self.get_savings_type_display()} KES {self.amount})"
