from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.common.models import AuditModel


class MonthlyDeduction(AuditModel):
    """
    Monthly deduction line item representing the scheduled check-off / deduction
    for a member in a specific month and year.
    Includes active loan installment, loan interest, charges, savings, shares, and others.
    """
    class DeductionStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PARTIAL = "partial", "Partially Paid"
        PAID = "paid", "Fully Paid"
        OVERPAID = "overpaid", "Overpaid"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="monthly_deductions",
    )
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.PROTECT,
        related_name="monthly_deductions",
        db_index=True,
    )
    month = models.PositiveSmallIntegerField(db_index=True)
    year = models.PositiveIntegerField(db_index=True)

    # Deduction breakdown columns (matches legacy Jimanage check-off sheet)
    charges = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Appraisal fees, processing, ledger charges, penalties",
    )
    loan_principal = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Loan installment principal component",
    )
    loan_interest = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Loan installment interest component",
    )
    registration_fee = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Unpaid registration fees",
    )
    savings = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("1500.00"),
        help_text="Mandatory / scheduled monthly savings deposit",
    )
    shares = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Monthly shares capital contribution",
    )
    others = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Welfare, insurance, or other monthly contributions",
    )

    total_expected = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Sum of all deduction items",
    )
    amount_paid = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Total amount remitted / paid for this month",
    )
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Remaining expected balance (total_expected - amount_paid)",
    )
    status = models.CharField(
        max_length=20,
        choices=DeductionStatus.choices,
        default=DeductionStatus.PENDING,
        db_index=True,
    )

    paid_thro = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Remittance method e.g. Payroll Checkoff, Bank Transfer, M-Pesa",
    )
    date_paid = models.DateField(
        null=True,
        blank=True,
    )
    notes = models.TextField(
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "tbl_monthly_deductions"
        ordering = ["year", "month", "member__first_name"]
        unique_together = [("organization", "member", "month", "year")]
        verbose_name = "Monthly Deduction"
        verbose_name_plural = "Monthly Deductions"

    def recalculate_totals(self):
        self.charges = Decimal(str(self.charges or 0))
        self.loan_principal = Decimal(str(self.loan_principal or 0))
        self.loan_interest = Decimal(str(self.loan_interest or 0))
        self.registration_fee = Decimal(str(self.registration_fee or 0))
        self.savings = Decimal(str(self.savings or 0))
        self.shares = Decimal(str(self.shares or 0))
        self.others = Decimal(str(self.others or 0))

        self.total_expected = (
            self.charges
            + self.loan_principal
            + self.loan_interest
            + self.registration_fee
            + self.savings
            + self.shares
            + self.others
        )

        self.amount_paid = Decimal(str(self.amount_paid or 0))
        self.balance = self.total_expected - self.amount_paid

        if self.amount_paid <= Decimal("0.00"):
            self.status = self.DeductionStatus.PENDING
        elif self.balance <= Decimal("0.00"):
            if self.balance < Decimal("0.00"):
                self.status = self.DeductionStatus.OVERPAID
            else:
                self.status = self.DeductionStatus.PAID
        else:
            self.status = self.DeductionStatus.PARTIAL

    def save(self, *args, **kwargs):
        self.recalculate_totals()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.member.full_name} ({self.month}/{self.year}) - Total: {self.total_expected}"


class MonthlyDeductionBatch(AuditModel):
    """
    Log of monthly deduction bulk uploads / remittances from employer payroll.
    """
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="deduction_batches",
    )
    batch_no = models.CharField(
        max_length=60,
        unique=True,
        db_index=True,
    )
    month = models.PositiveSmallIntegerField()
    year = models.PositiveIntegerField()
    paid_thro = models.CharField(
        max_length=50,
        default="payroll",
    )
    date_paid = models.DateField(
        default=timezone.now,
    )
    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    row_count = models.PositiveIntegerField(default=0)
    success_count = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)
    uploaded_file = models.FileField(
        upload_to="deductions/uploads/",
        null=True,
        blank=True,
    )
    remarks = models.TextField(
        blank=True,
        null=True,
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deduction_batches",
    )

    class Meta:
        db_table = "tbl_monthly_deduction_batches"
        ordering = ["-created_at"]
        verbose_name = "Monthly Deduction Batch"
        verbose_name_plural = "Monthly Deduction Batches"

    def __str__(self):
        return f"Batch {self.batch_no} ({self.month}/{self.year}) - KES {self.total_amount}"


class MonthlyDeductionItemLog(AuditModel):
    """
    Line-item log for bulk deductions upload.
    Explicitly tracks:
    1. What was uploaded in the Excel sheet (Employee No, Name, Total Remittance)
    2. What was used / allocated (Loan principal, Loan interest, Charges, Savings, Shares, Others, Surplus)
    """
    class ItemStatus(models.TextChoices):
        SUCCESS = "success", "Success"
        PARTIAL = "partial", "Partial"
        FAILED = "failed", "Failed"

    batch = models.ForeignKey(
        MonthlyDeductionBatch,
        on_delete=models.CASCADE,
        related_name="item_logs",
        db_index=True,
    )
    deduction = models.ForeignKey(
        MonthlyDeduction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="upload_logs",
    )
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deduction_upload_logs",
        db_index=True,
    )
    row_number = models.PositiveIntegerField(default=1)

    # 1. What was uploaded in excel sheet
    raw_employee_no = models.CharField(max_length=100, blank=True, default="")
    raw_employee_name = models.CharField(max_length=255, blank=True, default="")
    raw_total_ded = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))

    # 2. What was used / allocated
    amount_charges = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    amount_loan_interest = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    amount_loan_principal = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    amount_savings = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    amount_shares = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    amount_others = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    amount_surplus = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))

    status = models.CharField(
        max_length=20,
        choices=ItemStatus.choices,
        default=ItemStatus.SUCCESS,
        db_index=True,
    )
    error_message = models.TextField(blank=True, default="")

    class Meta:
        db_table = "tbl_monthly_deduction_item_logs"
        ordering = ["batch", "row_number"]
        verbose_name = "Monthly Deduction Item Log"
        verbose_name_plural = "Monthly Deduction Item Logs"

    def __str__(self):
        return f"Batch {self.batch.batch_no} Row {self.row_number} - {self.raw_employee_name} ({self.raw_total_ded})"
