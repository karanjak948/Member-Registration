"""
Repayment schedule generator.
Given a loan's principal, product configuration, and disbursement date,
returns a list of ScheduleEntry objects with exact due dates and amounts.
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

from apps.loans.services.engine.interest import (
    calculate_flat_interest,
    calculate_reducing_balance_schedule,
    calculate_compound_interest,
    round2,
    _to_d,
)


@dataclass
class ScheduleEntry:
    period_number: int
    due_date: date
    expected_amount: Decimal      # total installment due
    expected_principal: Decimal
    expected_interest: Decimal
    opening_balance: Decimal
    closing_balance: Decimal


def _add_months(sourcedate: date, months: int) -> date:
    """Add n months to a date, clamping day to month end if necessary."""
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _add_years(sourcedate: date, years: int) -> date:
    """Add n years to a date, handling Feb 29 leap year cases."""
    try:
        return sourcedate.replace(year=sourcedate.year + years)
    except ValueError:
        return sourcedate.replace(year=sourcedate.year + years, day=28)


def add_periods(start: date, frequency: str, n: int) -> date:
    """Advance `start` by n repayment periods using standard library."""
    if frequency == "daily":
        return start + timedelta(days=n)
    elif frequency == "weekly":
        return start + timedelta(weeks=n)
    elif frequency == "monthly":
        return _add_months(start, n)
    elif frequency == "yearly":
        return _add_years(start, n)
    raise ValueError(f"Unknown frequency: {frequency}")


def generate_schedule(
    principal: Decimal | float | int,
    interest_rate_pct: Decimal | float | int,
    interest_period: str,          # "monthly" | "yearly"
    interest_method: str,          # "flat" | "reducing_balance" | "compound"
    repayment_frequency: str,      # "daily" | "weekly" | "monthly" | "yearly"
    num_periods: int,
    disbursement_date: date,
) -> list[ScheduleEntry]:
    """
    Generate the full repayment schedule for a loan.
    First due date = disbursement_date + 1 period.
    """
    P = _to_d(principal)
    r_pct = _to_d(interest_rate_pct)
    n = int(num_periods)
    entries: list[ScheduleEntry] = []

    if interest_method == "flat":
        result = calculate_flat_interest(
            P, r_pct, n, interest_period, repayment_frequency
        )
        installment = result.installment
        interest_per_period = result.interest_per_period
        principal_per_period = result.principal_per_period
        balance = P

        for i in range(1, n + 1):
            due = add_periods(disbursement_date, repayment_frequency, i)
            if i == n:
                p = balance
                inst = round2(p + interest_per_period)
            else:
                p = principal_per_period
                inst = installment
            closing = round2(balance - p)
            if closing < Decimal("0"):
                closing = Decimal("0.00")

            entries.append(
                ScheduleEntry(
                    period_number=i,
                    due_date=due,
                    expected_amount=inst,
                    expected_principal=p,
                    expected_interest=interest_per_period,
                    opening_balance=round2(balance),
                    closing_balance=closing,
                )
            )
            balance = closing

    elif interest_method == "reducing_balance":
        schedule = calculate_reducing_balance_schedule(
            P, r_pct, n, interest_period, repayment_frequency
        )
        for i, row in enumerate(schedule, 1):
            due = add_periods(disbursement_date, repayment_frequency, i)
            entries.append(
                ScheduleEntry(
                    period_number=i,
                    due_date=due,
                    expected_amount=row.installment,
                    expected_principal=row.principal_component,
                    expected_interest=row.interest_charge,
                    opening_balance=row.opening_balance,
                    closing_balance=row.closing_balance,
                )
            )

    elif interest_method == "compound":
        schedule = calculate_compound_interest(
            P, r_pct, n, interest_period, repayment_frequency
        )
        for i, row in enumerate(schedule, 1):
            due = add_periods(disbursement_date, repayment_frequency, i)
            entries.append(
                ScheduleEntry(
                    period_number=i,
                    due_date=due,
                    expected_amount=row.installment,
                    expected_principal=row.principal_component,
                    expected_interest=row.interest_charge,
                    opening_balance=row.opening_balance,
                    closing_balance=row.closing_balance,
                )
            )

    else:
        raise ValueError(f"Unknown interest_method: {interest_method}")

    return entries
