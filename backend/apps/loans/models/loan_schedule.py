from django.db import models
from apps.loans.models.loan import Loan


class LoanScheduleEntry(models.Model):
    """
    Individual installment line item in the loan repayment schedule.
    """
    loan = models.ForeignKey(
        Loan, on_delete=models.CASCADE, related_name="schedule_entries"
    )
    period_number = models.PositiveIntegerField()
    due_date = models.DateField(db_index=True)

    # Expected installment breakdown
    expected_amount = models.DecimalField(max_digits=15, decimal_places=2)
    expected_principal = models.DecimalField(max_digits=15, decimal_places=2)
    expected_interest = models.DecimalField(max_digits=15, decimal_places=2)
    expected_fees = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    expected_penalty = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    # Paid amounts tracking
    paid_principal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    paid_interest = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    paid_fees = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    paid_penalty = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    # Balances
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2)
    closing_balance = models.DecimalField(max_digits=15, decimal_places=2)

    # Completion flag
    is_paid = models.BooleanField(default=False, db_index=True)
    paid_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "tbl_loan_schedule_entries"
        ordering = ["loan", "period_number"]
        unique_together = [("loan", "period_number")]

    def __str__(self):
        return f"Installment #{self.period_number} for {self.loan.loan_number} (Due: {self.due_date})"

    @property
    def total_paid(self):
        return self.paid_principal + self.paid_interest + self.paid_fees + self.paid_penalty

    @property
    def remaining_principal(self):
        return max(0, self.expected_principal - self.paid_principal)

    @property
    def remaining_interest(self):
        return max(0, self.expected_interest - self.paid_interest)

    @property
    def remaining_fees(self):
        return max(0, self.expected_fees - self.paid_fees)

    @property
    def remaining_penalty(self):
        return max(0, self.expected_penalty - self.paid_penalty)

    @property
    def total_due(self):
        return (
            self.remaining_principal
            + self.remaining_interest
            + self.remaining_fees
            + self.remaining_penalty
        )
