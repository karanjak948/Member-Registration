from django.db import models
from django.conf import settings
from apps.common.models import AuditModel


class InterestMethod(models.TextChoices):
    FLAT = "flat", "Flat"
    REDUCING_BALANCE = "reducing_balance", "Reducing Balance"
    COMPOUND = "compound", "Compound"


class InterestPeriod(models.TextChoices):
    MONTHLY = "monthly", "Monthly"
    YEARLY = "yearly", "Yearly"


class RepaymentFrequency(models.TextChoices):
    DAILY = "daily", "Daily"
    WEEKLY = "weekly", "Weekly"
    MONTHLY = "monthly", "Monthly"
    YEARLY = "yearly", "Yearly"


class SecurityType(models.TextChoices):
    PERCENTAGE = "percentage", "Percentage"
    FIXED_AMOUNT = "fixed_amount", "Fixed Amount"
    CUSTOM_TEXT = "custom_text", "Custom Text"


class FeeType(models.TextChoices):
    PERCENTAGE = "percentage", "Percentage"
    FIXED_AMOUNT = "fixed_amount", "Fixed Amount"


class DepositType(models.TextChoices):
    PERCENTAGE = "percentage", "Percentage"
    FIXED_AMOUNT = "fixed_amount", "Fixed Amount"


class LatePaymentPenaltyType(models.TextChoices):
    PERCENTAGE = "percentage", "Percentage"
    FIXED_AMOUNT = "fixed_amount", "Fixed Amount"


class OffsetCoverType(models.TextChoices):
    SAVINGS = "savings", "Savings"
    SECURITY = "security", "Security"
    BOTH = "both", "Both"


class LoanProduct(AuditModel):
    """
    Configurable loan product with immutable versioning.
    When a product is edited, a new version is spawned and the previous
    version is marked inactive, preserving existing loan contracts.
    """
    product_code = models.CharField(max_length=50, db_index=True)
    version_number = models.PositiveIntegerField(default=1)
    product_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True, db_index=True)
    effective_date = models.DateField()

    # Interest Settings
    interest_method = models.CharField(
        max_length=30,
        choices=InterestMethod.choices,
        default=InterestMethod.REDUCING_BALANCE,
    )
    interest_rate = models.DecimalField(max_digits=8, decimal_places=4)
    interest_period = models.CharField(
        max_length=20,
        choices=InterestPeriod.choices,
        default=InterestPeriod.MONTHLY,
    )

    # Repayment Terms
    repayment_frequency = models.CharField(
        max_length=20,
        choices=RepaymentFrequency.choices,
        default=RepaymentFrequency.MONTHLY,
    )
    min_repayment_period = models.PositiveIntegerField(default=1)
    max_repayment_period = models.PositiveIntegerField(null=True, blank=True)
    min_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    max_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    # Guarantor & Multipliers
    requires_guarantor = models.BooleanField(default=False)
    min_guarantors = models.PositiveIntegerField(default=0)
    is_multiple_of_savings = models.BooleanField(default=False)
    savings_multiplier = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)

    # Security / Collateral
    requires_security = models.BooleanField(default=False)
    security_type = models.CharField(
        max_length=30,
        choices=SecurityType.choices,
        null=True,
        blank=True,
    )
    security_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    security_notes = models.TextField(blank=True, null=True)

    # Deposit
    requires_deposit = models.BooleanField(default=False)
    deposit_type = models.CharField(
        max_length=30,
        choices=DepositType.choices,
        null=True,
        blank=True,
    )
    deposit_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    # Repayment Allocation Waterfall
    allocation_order = models.CharField(
        max_length=100,
        default="penalty,fees,interest,principal",
        help_text="Comma-separated payment allocation priority",
    )

    # Legacy / Default Penalty settings
    late_payment_penalty_type = models.CharField(
        max_length=30,
        choices=LatePaymentPenaltyType.choices,
        null=True,
        blank=True,
    )
    late_payment_penalty_value = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    grace_period_days = models.PositiveIntegerField(default=0)

    # Workflow controls
    requires_appraisal = models.BooleanField(default=False)
    requires_board_approval = models.BooleanField(default=False)

    # Aging & Delinquency Thresholds (days overdue)
    watchful_after_days = models.PositiveIntegerField(default=30)
    non_performing_after_days = models.PositiveIntegerField(default=90)
    doubtful_after_days = models.PositiveIntegerField(default=180)

    # Rescheduling & Offsets
    allows_rescheduling = models.BooleanField(default=False)
    reschedule_fee_type = models.CharField(
        max_length=30, choices=FeeType.choices, null=True, blank=True
    )
    reschedule_fee_value = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )

    allows_offset = models.BooleanField(default=False)
    offset_covers = models.CharField(
        max_length=30, choices=OffsetCoverType.choices, null=True, blank=True
    )
    offset_fee_type = models.CharField(
        max_length=30, choices=FeeType.choices, null=True, blank=True
    )
    offset_fee_value = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="loan_products",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "tbl_loan_products"
        ordering = ["product_code", "-version_number"]
        unique_together = [("product_code", "version_number")]

    def __str__(self):
        return f"{self.product_name} ({self.product_code} v{self.version_number})"


class LoanProductFee(models.Model):
    product = models.ForeignKey(
        LoanProduct, on_delete=models.CASCADE, related_name="fees"
    )
    fee_name = models.CharField(max_length=255)
    fee_type = models.CharField(max_length=30, choices=FeeType.choices)
    fee_value = models.DecimalField(max_digits=15, decimal_places=4)
    fee_basis = models.CharField(
        max_length=50,
        default="principal",
        help_text="principal | savings | deposit | loan_balance",
    )
    affects_principal = models.BooleanField(
        default=False,
        help_text="If true, fee amount is added to principal instead of deducted from disbursement",
    )
    show_in_statement = models.BooleanField(default=True)
    ledger_account_name = models.CharField(
        max_length=255, default="Loan Processing Fee Income"
    )

    class Meta:
        db_table = "tbl_loan_product_fees"

    def __str__(self):
        return f"{self.fee_name} - {self.fee_type} ({self.fee_value})"


class LoanProductPenalty(models.Model):
    product = models.ForeignKey(
        LoanProduct, on_delete=models.CASCADE, related_name="penalties"
    )
    penalty_name = models.CharField(max_length=255)
    penalty_type = models.CharField(
        max_length=30, choices=LatePaymentPenaltyType.choices
    )
    penalty_value = models.DecimalField(max_digits=15, decimal_places=2)
    grace_period_days = models.PositiveIntegerField(default=0)
    ledger_account_name = models.CharField(
        max_length=255, default="Penalty Income"
    )

    class Meta:
        db_table = "tbl_loan_product_penalties"

    def __str__(self):
        return f"{self.penalty_name} - {self.penalty_type} ({self.penalty_value})"
