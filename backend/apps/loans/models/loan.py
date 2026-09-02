from django.db import models
from django.conf import settings
from apps.common.models import AuditModel
from apps.loans.models.loan_product import LoanProduct


class LoanStatus(models.TextChoices):
    PENDING_APPLICATION = "pending_application", "Pending Application"
    APPRAISED = "appraised", "Appraised"
    APPROVED = "approved", "Approved"
    ACTIVE = "active", "Active"
    WATCHFUL = "watchful", "Watchful (1-30d Overdue)"
    NON_PERFORMING = "non_performing", "Non-Performing (31-90d Overdue)"
    DOUBTFUL = "doubtful", "Doubtful (91-180d Overdue)"
    CLOSED = "closed", "Closed / Fully Paid"
    WRITTEN_OFF = "written_off", "Written Off"
    REJECTED = "rejected", "Rejected"


class Loan(AuditModel):
    """
    Primary Loan account model managing lifecycle, balances, and terms.
    """
    loan_number = models.CharField(max_length=50, unique=True, db_index=True)
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.PROTECT,
        related_name="loans",
        db_index=True,
    )
    loan_product = models.ForeignKey(
        LoanProduct,
        on_delete=models.PROTECT,
        related_name="loans",
    )
    principal_amount = models.DecimalField(max_digits=15, decimal_places=2)
    security_provided_value = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    security_provided_notes = models.TextField(blank=True, null=True)
    deposit_paid_amount = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )

    # Dates
    application_date = models.DateField()
    disbursement_date = models.DateField(null=True, blank=True)
    maturity_date = models.DateField(null=True, blank=True)

    # Term config
    num_periods = models.PositiveIntegerField(help_text="Number of repayment installments")
    interest_rate = models.DecimalField(max_digits=8, decimal_places=4)
    interest_method = models.CharField(max_length=30)
    repayment_frequency = models.CharField(max_length=20)

    # Lifecycle & balances
    status = models.CharField(
        max_length=30,
        choices=LoanStatus.choices,
        default=LoanStatus.PENDING_APPLICATION,
        db_index=True,
    )
    outstanding_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    principal_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    interest_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    penalty_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    fees_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    # Total amounts tracked
    total_principal_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_interest_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_fees_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_penalties_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    # Delinquency tracking
    days_overdue = models.PositiveIntegerField(default=0)
    last_payment_date = models.DateField(null=True, blank=True)

    # Audit & Approval workflow
    appraisal_notes = models.TextField(blank=True, null=True)
    appraised_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appraised_loans",
    )
    appraised_at = models.DateTimeField(null=True, blank=True)

    approval_notes = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_loans",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    disbursed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="disbursed_loans",
    )

    rejection_reason = models.TextField(blank=True, null=True)
    rejected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rejected_loans",
    )
    rejected_at = models.DateTimeField(null=True, blank=True)

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="loans",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "tbl_loans"
        ordering = ["-application_date", "-created_at"]

    def __str__(self):
        return f"{self.loan_number} - {self.member} ({self.get_status_display()})"


class LoanGuarantor(AuditModel):
    """Guarantors pledged to secure a loan."""
    loan = models.ForeignKey(
        Loan, on_delete=models.CASCADE, related_name="guarantors"
    )
    guarantor_member = models.ForeignKey(
        "members.Member", on_delete=models.PROTECT, related_name="guaranteed_loans"
    )
    guarantee_amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=[("pending", "Pending"), ("accepted", "Accepted"), ("rejected", "Rejected")],
        default="accepted",
    )
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "tbl_loan_guarantors"

    def __str__(self):
        return f"{self.guarantor_member} guarantees {self.guarantee_amount} for {self.loan.loan_number}"


class LoanCollateral(AuditModel):
    """Physical assets or securities pledged for a loan."""
    loan = models.ForeignKey(
        Loan, on_delete=models.CASCADE, related_name="collaterals"
    )
    asset_type = models.CharField(
        max_length=50,
        help_text="VEHICLE | LAND_TITLE | LOGBOOK | EQUIPMENT | SHARES | OTHER",
    )
    asset_name = models.CharField(max_length=255)
    serial_or_reg_number = models.CharField(max_length=100, blank=True, null=True)
    estimated_value = models.DecimalField(max_digits=15, decimal_places=2)
    document = models.FileField(upload_to="loans/collateral/", blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_collaterals",
    )
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "tbl_loan_collaterals"

    def __str__(self):
        return f"{self.asset_type}: {self.asset_name} ({self.estimated_value}) for {self.loan.loan_number}"
