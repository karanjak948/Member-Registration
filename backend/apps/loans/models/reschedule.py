from django.db import models
from django.conf import settings
from apps.common.models import AuditModel
from apps.loans.models.loan import Loan


class LoanReschedule(AuditModel):
    """
    Loan term modification / restructuring audit record.
    """
    loan = models.ForeignKey(
        Loan, on_delete=models.CASCADE, related_name="reschedules"
    )
    reschedule_date = models.DateField()
    old_outstanding_balance = models.DecimalField(max_digits=15, decimal_places=2)
    new_principal = models.DecimalField(max_digits=15, decimal_places=2)
    new_interest_rate = models.DecimalField(max_digits=8, decimal_places=4)
    new_num_periods = models.PositiveIntegerField()
    reschedule_fee = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    reason = models.TextField()
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_reschedules",
    )

    class Meta:
        db_table = "tbl_loan_reschedules"
        ordering = ["-reschedule_date", "-created_at"]

    def __str__(self):
        return f"Reschedule for {self.loan.loan_number} on {self.reschedule_date}"
