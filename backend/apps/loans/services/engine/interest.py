"""
Interest calculation engine.
Handles Flat, Reducing Balance (French Amortization), and Compound interest methods.
All math uses Decimal with strict rounding (ROUND_HALF_UP).
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal

PERIODS_PER_YEAR = {
    "daily": 365,
    "weekly": 52,
    "monthly": 12,
    "yearly": 1,
}


def round2(val: Decimal | float | int | str) -> Decimal:
    """Round to 2 decimal places using standard half-up rounding."""
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _to_d(val: Decimal | float | int | str) -> Decimal:
    return Decimal(str(val))


@dataclass
class FlatInterestResult:
    total_interest: Decimal
    total_payable: Decimal
    installment: Decimal
    interest_per_period: Decimal
    principal_per_period: Decimal


@dataclass
class ReducingBalanceRow:
    period_number: int
    opening_balance: Decimal
    installment: Decimal
    principal_component: Decimal
    interest_charge: Decimal
    closing_balance: Decimal


def calculate_flat_interest(
    principal: Decimal | float | int,
    interest_rate_pct: Decimal | float | int,
    num_periods: int,
    interest_period: Literal["monthly", "yearly"] = "monthly",
    repayment_frequency: Literal["daily", "weekly", "monthly", "yearly"] = "monthly",
) -> FlatInterestResult:
    """
    Flat interest:
      Total Interest = Principal * (annual_rate * total_years)
      Total Payable  = Principal + Total Interest
      Installment    = Total Payable / num_periods
    """
    P = _to_d(principal)
    r_pct = _to_d(interest_rate_pct)
    n = _to_d(num_periods)

    if n <= 0:
        raise ValueError("num_periods must be positive.")

    # Determine nominal annual rate
    if interest_period == "yearly":
        annual_rate = r_pct / _to_d(100)
    elif interest_period == "monthly":
        annual_rate = (r_pct / _to_d(100)) * _to_d(12)
    else:
        raise ValueError(f"Unknown interest_period: {interest_period}")

    freq_py = _to_d(PERIODS_PER_YEAR[repayment_frequency])
    total_years = n / freq_py

    total_interest = round2(P * annual_rate * total_years)
    total_payable = round2(P + total_interest)
    installment = round2(total_payable / n)
    interest_per_period = round2(total_interest / n)
    principal_per_period = round2(P / n)

    return FlatInterestResult(
        total_interest=total_interest,
        total_payable=total_payable,
        installment=installment,
        interest_per_period=interest_per_period,
        principal_per_period=principal_per_period,
    )


def calculate_reducing_balance_schedule(
    principal: Decimal | float | int,
    interest_rate_pct: Decimal | float | int,
    num_periods: int,
    interest_period: Literal["monthly", "yearly"] = "monthly",
    repayment_frequency: Literal["daily", "weekly", "monthly", "yearly"] = "monthly",
) -> list[ReducingBalanceRow]:
    """
    Reducing balance with equal installments (French Amortization).
    PMT = P * [ r*(1+r)^n ] / [ (1+r)^n - 1 ]
    where r is the effective rate per repayment period.
    """
    P = _to_d(principal)
    r_pct = _to_d(interest_rate_pct)
    n = int(num_periods)

    if n <= 0:
        raise ValueError("num_periods must be positive.")

    # Periodic rate
    if interest_period == "yearly":
        annual_rate = r_pct / _to_d(100)
    else:
        annual_rate = (r_pct / _to_d(100)) * _to_d(12)

    freq_py = _to_d(PERIODS_PER_YEAR[repayment_frequency])
    r_per = annual_rate / freq_py

    if r_per == Decimal("0"):
        installment = round2(P / _to_d(n))
    else:
        factor = (Decimal("1") + r_per) ** n
        installment = round2(P * (r_per * factor) / (factor - Decimal("1")))

    schedule: list[ReducingBalanceRow] = []
    balance = P

    for period in range(1, n + 1):
        interest_charge = round2(balance * r_per)

        if period == n:
            principal_comp = balance
            actual_installment = round2(principal_comp + interest_charge)
            closing_balance = Decimal("0.00")
        else:
            principal_comp = round2(installment - interest_charge)
            closing_balance = round2(balance - principal_comp)
            actual_installment = installment

            if closing_balance < Decimal("0"):
                principal_comp = balance
                closing_balance = Decimal("0.00")
                actual_installment = round2(principal_comp + interest_charge)

        schedule.append(
            ReducingBalanceRow(
                period_number=period,
                opening_balance=round2(balance),
                installment=actual_installment,
                principal_component=principal_comp,
                interest_charge=interest_charge,
                closing_balance=closing_balance,
            )
        )
        balance = closing_balance

    return schedule


def calculate_compound_interest(
    principal: Decimal | float | int,
    interest_rate_pct: Decimal | float | int,
    num_periods: int,
    interest_period: Literal["monthly", "yearly"] = "monthly",
    repayment_frequency: Literal["daily", "weekly", "monthly", "yearly"] = "monthly",
) -> list[ReducingBalanceRow]:
    """
    Compound interest schedule where rate compounds per repayment period.
    """
    P = _to_d(principal)
    r_pct = _to_d(interest_rate_pct)
    n = int(num_periods)

    if n <= 0:
        raise ValueError("num_periods must be positive.")

    ipy = _to_d(PERIODS_PER_YEAR[interest_period])
    rpy = _to_d(PERIODS_PER_YEAR[repayment_frequency])
    r_annual = (_to_d(r_pct) / _to_d(100))

    if interest_period == "monthly":
        r_annual = r_annual * _to_d(12)

    r_per = r_annual / rpy

    if r_per == Decimal("0"):
        installment = round2(P / _to_d(n))
    else:
        factor = (Decimal("1") + r_per) ** n
        installment = round2(P * (r_per * factor) / (factor - Decimal("1")))

    schedule: list[ReducingBalanceRow] = []
    balance = P

    for period in range(1, n + 1):
        interest_charge = round2(balance * r_per)
        if period == n:
            principal_comp = balance
            actual_installment = round2(principal_comp + interest_charge)
            closing_balance = Decimal("0.00")
        else:
            principal_comp = round2(installment - interest_charge)
            closing_balance = round2(balance - principal_comp)
            actual_installment = installment

            if closing_balance < Decimal("0"):
                principal_comp = balance
                closing_balance = Decimal("0.00")
                actual_installment = round2(principal_comp + interest_charge)

        schedule.append(
            ReducingBalanceRow(
                period_number=period,
                opening_balance=round2(balance),
                installment=actual_installment,
                principal_component=principal_comp,
                interest_charge=interest_charge,
                closing_balance=closing_balance,
            )
        )
        balance = closing_balance

    return schedule
