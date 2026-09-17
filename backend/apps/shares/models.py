from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.common.models import AuditModel


class SharePayment(AuditModel):
    """
    Share capital payment transaction record for SACCO members.
    Supports Ordinary Shares, Preference Shares, and Capital Shares.
    """
    class ShareType(models.TextChoices):
        ORDINARY = "ordinary", "Ordinary Shares"
        PREFERENCE = "preference", "Preference Shares"
        CAPITAL = "capital", "Capital Shares"

    class PaymentMode(models.TextChoices):
        MPESA = "mpesa", "M-pesa"
        CASH = "cash", "Cash"
        BANK = "bank", "Bank"
        CHEQUE = "cheque", "Cheque"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="share_payments",
    )
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.PROTECT,
        related_name="share_payments",
    )
    document_no = models.CharField(
        max_length=100,
        db_index=True,
    )
    share_type = models.CharField(
        max_length=30,
        choices=ShareType.choices,
        default=ShareType.ORDINARY,
    )
    number_of_shares = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("1.00"),
    )
    share_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("100.00"),
    )
    total_amount = models.DecimalField(
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
        related_name="recorded_share_payments",
    )

    class Meta:
        db_table = "tbl_share_payments"
        ordering = ["-paid_on", "-created_at"]
        verbose_name = "Share Payment"
        verbose_name_plural = "Share Payments"

    def save(self, *args, **kwargs):
        if not self.total_amount:
            self.total_amount = Decimal(str(self.number_of_shares or 1)) * Decimal(str(self.share_price or 100))

        if not self.document_no:
            # Generate sequential document number starting from 100001
            last_id = SharePayment.objects.aggregate(max_id=models.Max("id"))["max_id"] or 0
            self.document_no = f"{100000 + last_id + 1}"

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
        member_name = self.member.full_name if self.member else "—"
        return f"{self.document_no} - {member_name} ({self.get_share_type_display()} KES {self.total_amount})"
