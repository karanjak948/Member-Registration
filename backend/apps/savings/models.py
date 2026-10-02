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
    # Reversal tracking
    is_reversed = models.BooleanField(
        default=False,
        db_index=True,
    )
    reversed_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    reversed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reversed_savings_payments",
    )
    reversal_reason = models.TextField(
        blank=True,
        default="",
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
        member_name = self.member.full_name if self.member else "—"
        rev = " [REVERSED]" if self.is_reversed else ""
        return f"{self.document_no} - {member_name} ({self.get_savings_type_display()} KES {self.amount}){rev}"


class SavingsWithdrawal(AuditModel):
    """
    Savings Withdrawal registry matching legacy Jimanage SACCO system.
    Supports Exit Sacco, Loan Repayment, Saving Refund, Excess Savings, Partial Withdrawal.
    """
    class WithdrawalType(models.TextChoices):
        EXIT_SACCO = "exit_sacco", "Exit Sacco"
        LOAN_REPAYMENT = "loan_repayment", "Loan Repayment"
        SAVING_REFUND = "saving_refund", "Saving Refund"
        EXCESS_SAVINGS = "excess_savings", "Excess Savings"
        PARTIAL_WITHDRAWAL = "partial_withdrawal", "Partial Withdrawal"
        OTHER = "other", "Other"

    class SavingsSource(models.TextChoices):
        NORMAL = "normal", "Normal Savings"
        WELFARE = "welfare", "Welfare"

    class BankAccount(models.TextChoices):
        MPESA = "mpesa", "M-Pesa"
        BANK = "bank", "Bank Transfer"
        CASH = "cash", "Cash"
        CHEQUE = "cheque", "Cheque"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="savings_withdrawals",
    )
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.PROTECT,
        related_name="savings_withdrawals",
        db_index=True,
    )
    payroll_no = models.CharField(
        max_length=50,
        blank=True,
        default="",
    )
    withdrawal_type = models.CharField(
        max_length=50,
        choices=WithdrawalType.choices,
        default=WithdrawalType.PARTIAL_WITHDRAWAL,
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    date_withdrawn = models.DateField(
        default=timezone.now,
        db_index=True,
    )
    savings_drawn_from = models.CharField(
        max_length=30,
        choices=SavingsSource.choices,
        default=SavingsSource.NORMAL,
    )
    bank = models.CharField(
        max_length=30,
        choices=BankAccount.choices,
        default=BankAccount.MPESA,
    )
    document_code = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Transaction reference / cheque no / document code",
    )
    reason = models.TextField(
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(
        default=True,
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recorded_savings_withdrawals",
    )
    # Linked payment record for money out ledger posting
    linked_payment = models.OneToOneField(
        SavingsPayment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="source_withdrawal",
    )

    class Meta:
        db_table = "tbl_savings_withdrawals"
        ordering = ["-date_withdrawn", "-created_at"]
        verbose_name = "Savings Withdrawal"
        verbose_name_plural = "Savings Withdrawals"

    def save(self, *args, **kwargs):
        if not self.payroll_no and self.member:
            self.payroll_no = getattr(self.member, "payroll_number", None) or self.member.membership_number or ""
        
        super().save(*args, **kwargs)

        # Ensure corresponding MONEY_OUT SavingsPayment is synced if active
        if self.is_active:
            if not self.linked_payment:
                payment = SavingsPayment.objects.create(
                    organization=self.organization,
                    member=self.member,
                    savings_type=self.savings_drawn_from,
                    transaction_type=SavingsPayment.TransactionType.MONEY_OUT,
                    amount=self.amount,
                    payment_mode=self.bank if self.bank in SavingsPayment.PaymentMode.values else SavingsPayment.PaymentMode.BANK,
                    transaction_no=self.document_code or "",
                    paid_on=self.date_withdrawn,
                    remarks=f"Savings withdrawal ({self.get_withdrawal_type_display()}): {self.reason or ''}".strip(),
                    recorded_by=self.recorded_by or self.created_by,
                )
                self.linked_payment = payment
                super().save(update_fields=["linked_payment"])
            else:
                self.linked_payment.amount = self.amount
                self.linked_payment.paid_on = self.date_withdrawn
                self.linked_payment.savings_type = self.savings_drawn_from
                self.linked_payment.transaction_no = self.document_code or ""
                self.linked_payment.remarks = f"Savings withdrawal ({self.get_withdrawal_type_display()}): {self.reason or ''}".strip()
                self.linked_payment.save()
        else:
            # If deactivated / cancelled, mark linked payment reversed
            if self.linked_payment and not self.linked_payment.is_reversed:
                self.linked_payment.is_reversed = True
                self.linked_payment.reversal_reason = "Withdrawal marked inactive / cancelled"
                self.linked_payment.reversed_at = timezone.now()
                self.linked_payment.save()

    def __str__(self):
        return f"{self.member.full_name} - {self.get_withdrawal_type_display()} KES {self.amount}"
