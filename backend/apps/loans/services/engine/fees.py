"""
Fee calculation engine.
Calculates processing, insurance, application, and administrative fees
based on product configuration rules.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from apps.loans.services.engine.interest import round2, _to_d


@dataclass
class CalculatedFee:
    fee_name: str
    fee_type: Literal["fixed_amount", "percentage"]
    fee_value: Decimal
    fee_basis: str
    calculated_amount: Decimal
    affects_principal: bool
    show_in_statement: bool
    ledger_account_name: str


def calculate_fee(
    fee_name: str,
    fee_type: str,
    fee_value: Decimal | float | int | str,
    fee_basis: str = "principal",
    principal: Decimal | float | int | str = "0",
    savings_balance: Decimal | float | int | str = "0",
    deposit_amount: Decimal | float | int | str = "0",
    loan_balance: Decimal | float | int | str = "0",
    affects_principal: bool = False,
    show_in_statement: bool = True,
    ledger_account_name: str = "Loan Processing Fee Income",
) -> CalculatedFee:
    val = _to_d(fee_value)
    p = _to_d(principal)
    sav = _to_d(savings_balance)
    dep = _to_d(deposit_amount)
    bal = _to_d(loan_balance)

    if fee_type == "fixed_amount":
        amount = round2(val)
    elif fee_type == "percentage":
        if fee_basis == "principal":
            base = p
        elif fee_basis == "savings":
            base = sav
        elif fee_basis == "deposit":
            base = dep
        elif fee_basis == "loan_balance":
            base = bal
        else:
            base = p
        amount = round2(base * (val / _to_d(100)))
    else:
        raise ValueError(f"Unknown fee_type: {fee_type}")

    return CalculatedFee(
        fee_name=fee_name,
        fee_type=fee_type,  # type: ignore
        fee_value=val,
        fee_basis=fee_basis,
        calculated_amount=amount,
        affects_principal=affects_principal,
        show_in_statement=show_in_statement,
        ledger_account_name=ledger_account_name,
    )
