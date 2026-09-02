"""
Loan Aging & Portfolio At Risk (PAR) Engine.
Classifies loan accounts according to days past due:
- Current (0 days)
- Watchful (1 - 30 days)
- Substandard / Non-performing (31 - 90 days)
- Doubtful (91 - 180 days)
- Loss / Written Off (> 180 days)
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Literal

from apps.loans.services.engine.interest import round2, _to_d

AgingCategory = Literal["current", "watchful", "non_performing", "doubtful", "loss"]


@dataclass
class AgingClassification:
    days_overdue: int
    category: AgingCategory
    recommended_provision_pct: Decimal
    provision_amount: Decimal


def classify_loan_aging(
    days_overdue: int,
    outstanding_balance: Decimal | float | int | str,
    watchful_days: int = 30,
    non_performing_days: int = 90,
    doubtful_days: int = 180,
) -> AgingClassification:
    bal = round2(_to_d(outstanding_balance))

    if days_overdue <= 0:
        cat: AgingCategory = "current"
        prov_pct = Decimal("0.01")  # 1% standard provision
    elif days_overdue <= watchful_days:
        cat = "watchful"
        prov_pct = Decimal("0.05")  # 5%
    elif days_overdue <= non_performing_days:
        cat = "non_performing"
        prov_pct = Decimal("0.25")  # 25%
    elif days_overdue <= doubtful_days:
        cat = "doubtful"
        prov_pct = Decimal("0.50")  # 50%
    else:
        cat = "loss"
        prov_pct = Decimal("1.00")  # 100%

    prov_amt = round2(bal * prov_pct)

    return AgingClassification(
        days_overdue=max(0, days_overdue),
        category=cat,
        recommended_provision_pct=prov_pct * Decimal("100"),
        provision_amount=prov_amt,
    )
