"""
Waterfall Repayment Engine.
Allocates payment amounts according to product allocation priorities
(e.g., penalty -> fees -> interest -> principal).
Supports partial payments, exact payments, and overpayments.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from apps.loans.services.engine.interest import round2, _to_d


@dataclass
class RepaymentAllocation:
    allocated_penalty: Decimal
    allocated_fees: Decimal
    allocated_interest: Decimal
    allocated_principal: Decimal
    remaining_unallocated: Decimal
    total_allocated: Decimal


def allocate_repayment_waterfall(
    payment_amount: Decimal | float | int | str,
    outstanding_penalty: Decimal | float | int | str = 0,
    outstanding_fees: Decimal | float | int | str = 0,
    outstanding_interest: Decimal | float | int | str = 0,
    outstanding_principal: Decimal | float | int | str = 0,
    allocation_order: str = "penalty,fees,interest,principal",
) -> RepaymentAllocation:
    """
    Distribute payment_amount across components based on allocation_order.
    Default order: penalty -> fees -> interest -> principal.
    """
    rem = round2(_to_d(payment_amount))
    due_penalty = round2(_to_d(outstanding_penalty))
    due_fees = round2(_to_d(outstanding_fees))
    due_interest = round2(_to_d(outstanding_interest))
    due_principal = round2(_to_d(outstanding_principal))

    alloc_pen = Decimal("0.00")
    alloc_fee = Decimal("0.00")
    alloc_int = Decimal("0.00")
    alloc_prn = Decimal("0.00")

    order = [item.strip().lower() for item in allocation_order.split(",") if item.strip()]

    for component in order:
        if rem <= Decimal("0.00"):
            break

        if component == "penalty":
            pay = min(rem, due_penalty)
            alloc_pen += pay
            rem -= pay

        elif component in ("fees", "fee"):
            pay = min(rem, due_fees)
            alloc_fee += pay
            rem -= pay

        elif component in ("interest", "int"):
            pay = min(rem, due_interest)
            alloc_int += pay
            rem -= pay

        elif component in ("principal", "prn"):
            pay = min(rem, due_principal)
            alloc_prn += pay
            rem -= pay

    # If money remains and principal was not fully paid, allocate up to entire remaining principal
    if rem > Decimal("0.00") and alloc_prn < due_principal:
        extra_prn = min(rem, due_principal - alloc_prn)
        alloc_prn += extra_prn
        rem -= extra_prn

    total_alloc = alloc_pen + alloc_fee + alloc_int + alloc_prn

    return RepaymentAllocation(
        allocated_penalty=round2(alloc_pen),
        allocated_fees=round2(alloc_fee),
        allocated_interest=round2(alloc_int),
        allocated_principal=round2(alloc_prn),
        remaining_unallocated=round2(rem),
        total_allocated=round2(total_alloc),
    )
