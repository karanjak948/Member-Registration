import logging
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, Q

from apps.members.models import Member
from apps.loans.models import Loan, LoanStatus
from apps.loans.models.loan_schedule import LoanScheduleEntry
from apps.deductions.models import MonthlyDeduction

logger = logging.getLogger(__name__)


def generate_monthly_deductions(
    organization,
    month: int,
    year: int,
    user=None,
    force_regenerate: bool = False,
    default_savings: Decimal = Decimal("1500.00"),
    default_shares: Decimal = Decimal("0.00"),
):
    """
    Generate or regenerate the monthly deduction schedule for all active members
    in the organization for a given month and year.

    Calculates:
      - Charges: Loan schedule expected fees/penalties or loan charges
      - Loan installment: Expected principal from active loan schedules due in month/year
      - Loan interest: Expected interest from active loan schedules due in month/year
      - Registration fee: 0.00 or pending onboarding fee
      - Savings: Standard or configured monthly savings (default KES 1,500)
      - Shares: Scheduled monthly share capital contribution (default KES 0)
      - Others: Welfare or ancillary deductions
      - Total: Sum of the above
    """
    # 1. Fetch active members for the organization
    members_qs = Member.objects.filter(
        organization=organization
    ).filter(
        Q(status__iexact="ACTIVE") | Q(registration_stage__iexact="ACTIVE")
    )

    created_count = 0
    updated_count = 0
    total_expected_sum = Decimal("0.00")

    with transaction.atomic():
        for member in members_qs:
            # 2. Check active loans for this member
            active_loans = Loan.objects.filter(
                member=member,
                status__in=[
                    LoanStatus.ACTIVE,
                    LoanStatus.WATCHFUL,
                    LoanStatus.NON_PERFORMING,
                    LoanStatus.DOUBTFUL,
                ],
            )

            charges = Decimal("0.00")
            loan_principal = Decimal("0.00")
            loan_interest = Decimal("0.00")

            if active_loans.exists():
                # Query schedule entries due in this month & year
                schedule_entries = LoanScheduleEntry.objects.filter(
                    loan__in=active_loans,
                    due_date__year=year,
                    due_date__month=month,
                )

                if schedule_entries.exists():
                    for entry in schedule_entries:
                        # Use remaining amounts if already partially paid, otherwise expected
                        p_amt = entry.remaining_principal if entry.paid_principal > 0 else entry.expected_principal
                        i_amt = entry.remaining_interest if entry.paid_interest > 0 else entry.expected_interest
                        f_amt = (
                            (entry.remaining_fees + entry.remaining_penalty)
                            if (entry.paid_fees > 0 or entry.paid_penalty > 0)
                            else (entry.expected_fees + entry.expected_penalty)
                        )
                        loan_principal += Decimal(str(p_amt or 0))
                        loan_interest += Decimal(str(i_amt or 0))
                        charges += Decimal(str(f_amt or 0))
                else:
                    # Fallback for loans without specific calendar schedule entries:
                    # amortize reference weekly/monthly installment if available
                    for l in active_loans:
                        if l.principal_balance > 0:
                            # Estimate one month installment if active
                            num_periods = max(1, l.num_periods or 1)
                            approx_p = (l.principal_balance / num_periods).quantize(Decimal("0.01"))
                            approx_i = (l.interest_balance / num_periods).quantize(Decimal("0.01"))
                            loan_principal += approx_p
                            loan_interest += approx_i

            registration_fee = Decimal("0.00")
            savings = default_savings
            shares = default_shares
            others = Decimal("0.00")

            # 3. Check if deduction record already exists
            deduction, created = MonthlyDeduction.objects.get_or_create(
                organization=organization,
                member=member,
                month=month,
                year=year,
                defaults={
                    "charges": charges,
                    "loan_principal": loan_principal,
                    "loan_interest": loan_interest,
                    "registration_fee": registration_fee,
                    "savings": savings,
                    "shares": shares,
                    "others": others,
                    "created_by": user,
                    "updated_by": user,
                },
            )

            if created:
                created_count += 1
            elif force_regenerate:
                # Update expected amounts while keeping existing payments
                deduction.charges = charges
                deduction.loan_principal = loan_principal
                deduction.loan_interest = loan_interest
                # Preserve manual overrides on savings/shares if already customized
                if deduction.savings == Decimal("0.00") or deduction.savings == default_savings:
                    deduction.savings = savings
                if deduction.shares == Decimal("0.00"):
                    deduction.shares = shares
                deduction.updated_by = user
                deduction.save()
                updated_count += 1

            total_expected_sum += deduction.total_expected

    return {
        "month": month,
        "year": year,
        "total_members": members_qs.count(),
        "created_count": created_count,
        "updated_count": updated_count,
        "total_expected": total_expected_sum,
    }
