"""Loans Engine package exports."""

from apps.loans.services.engine.interest import (
    calculate_flat_interest,
    calculate_reducing_balance_schedule,
    calculate_compound_interest,
    round2,
)
from apps.loans.services.engine.schedule import (
    generate_schedule,
    ScheduleEntry,
)
from apps.loans.services.engine.fees import (
    calculate_fee,
    CalculatedFee,
)
from apps.loans.services.engine.penalties import (
    calculate_late_penalty,
    CalculatedPenalty,
)
from apps.loans.services.engine.repayment import (
    allocate_repayment_waterfall,
    RepaymentAllocation,
)
from apps.loans.services.engine.aging import (
    classify_loan_aging,
    AgingClassification,
)

__all__ = [
    "calculate_flat_interest",
    "calculate_reducing_balance_schedule",
    "calculate_compound_interest",
    "round2",
    "generate_schedule",
    "ScheduleEntry",
    "calculate_fee",
    "CalculatedFee",
    "calculate_late_penalty",
    "CalculatedPenalty",
    "allocate_repayment_waterfall",
    "RepaymentAllocation",
    "classify_loan_aging",
    "AgingClassification",
]
