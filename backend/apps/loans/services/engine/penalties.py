"""
Penalty calculation engine.
Calculates late payment charges and overdue penalties according to product rules.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from apps.loans.services.engine.interest import round2, _to_d


@dataclass
class CalculatedPenalty:
    penalty_name: str
    penalty_type: Literal["fixed_amount", "percentage"]
    penalty_value: Decimal
    calculated_amount: Decimal
    ledger_account_name: str


def calculate_late_penalty(
    penalty_name: str,
    penalty_type: str,
    penalty_value: Decimal | float | int | str,
    overdue_installment_amount: Decimal | float | int | str,
    days_overdue: int,
    grace_period_days: int = 0,
    ledger_account_name: str = "Penalty Income",
) -> CalculatedPenalty:
    """
    Calculate late payment penalty if past grace period.
    """
    if days_overdue <= grace_period_days:
        return CalculatedPenalty(
            penalty_name=penalty_name,
            penalty_type=penalty_type,  # type: ignore
            penalty_value=_to_d(penalty_value),
            calculated_amount=Decimal("0.00"),
            ledger_account_name=ledger_account_name,
        )

    val = _to_d(penalty_value)
    overdue_amt = _to_d(overdue_installment_amount)

    if penalty_type == "fixed_amount":
        amount = round2(val)
    elif penalty_type == "percentage":
        amount = round2(overdue_amt * (val / _to_d(100)))
    else:
        amount = Decimal("0.00")

    return CalculatedPenalty(
        penalty_name=penalty_name,
        penalty_type=penalty_type,  # type: ignore
        penalty_value=val,
        calculated_amount=amount,
        ledger_account_name=ledger_account_name,
    )
