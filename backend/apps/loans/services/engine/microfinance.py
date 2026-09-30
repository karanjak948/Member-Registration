"""
Microfinance Loan Engine.
Implementation of Peter Irungu's Single-Balance Model (20% Every 30 Days)
and Reference Weekly Installment Generator.

Core Rules Implemented:
1. The original loan amount is entered at disbursement.
2. A 20% charge is added immediately at disbursement (Cycle 1 interest).
3. The resulting amount becomes the opening outstanding balance.
4. Every borrower payment reduces the single outstanding balance.
5. Every 30 days, 20% is added to the balance then outstanding.
6. The 30-day charge compounds because it is calculated on the full current balance.
7. Reference weekly payments are generated every 7 days using binary search simulation.
8. If payment date and interest date coincide, payment is processed first, then interest.
9. Multiple payments within the same 30-day cycle:
   - First payment covers the 30-day cycle interest. Excess reduces principal directly.
   - Subsequent payments in the same cycle incur 0 interest; 100% reduces principal.
10. In the next 30-day cycle, interest is 20% of the remaining principal/balance.
"""

from __future__ import annotations

from calendar import monthrange
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Tuple


def _to_d(val: Decimal | float | int | str) -> Decimal:
    return Decimal(str(val))


def round2(val: Decimal | float | int | str) -> Decimal:
    """Round to 2 decimal places using standard half-up rounding."""
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def add_calendar_months(d: date, months: int) -> date:
    """Add calendar months to a date, clamping day to end of month if necessary."""
    year = d.year + (d.month - 1 + months) // 12
    month = (d.month - 1 + months) % 12 + 1
    day = min(d.day, monthrange(year, month)[1])
    return date(year, month, day)


def generate_weekly_dates(disbursement_date: date, maturity_date: date) -> List[date]:
    """Generate weekly payment dates every 7 days from disbursement up to maturity."""
    dates: List[date] = []
    current = disbursement_date + timedelta(days=7)
    while current <= maturity_date:
        dates.append(current)
        current += timedelta(days=7)
    return dates


def generate_interest_dates(
    disbursement_date: date, maturity_date: date, cycle_days: int = 30
) -> List[date]:
    """Generate 30-day compounding interest dates from disbursement up to maturity."""
    dates: List[date] = []
    current = disbursement_date + timedelta(days=cycle_days)
    while current <= maturity_date:
        dates.append(current)
        current += timedelta(days=cycle_days)
    return dates


@dataclass
class ReferenceEvent:
    date: date
    type: str  # "REFERENCE_PAYMENT" | "30_DAY_INTEREST"
    amount: Decimal
    balance: Decimal


def simulate_microfinance_loan(
    loan_amount: Decimal | float | int,
    rate: Decimal | float | int,
    weekly_payment: Decimal | float | int,
    disbursement_date: date,
    term_months: int,
    cycle_days: int = 30,
) -> Tuple[Decimal, List[ReferenceEvent]]:
    """
    Simulates the loan lifecycle with weekly reference payments and 30-day interest events.
    Matches Peter Irungu's exact Python implementation.
    """
    P = _to_d(loan_amount)
    r = _to_d(rate)
    w = _to_d(weekly_payment)

    maturity_date = add_calendar_months(disbursement_date, term_months)
    payment_dates = generate_weekly_dates(disbursement_date, maturity_date)
    interest_dates = generate_interest_dates(disbursement_date, maturity_date, cycle_days)

    # Immediate first 20% charge
    balance = round2(P * (_to_d(1) + r))
    events: List[ReferenceEvent] = []

    all_dates = sorted(set(payment_dates + interest_dates))

    for current_date in all_dates:
        # Payment is processed first if payment and interest happen on the same date
        if current_date in payment_dates and balance > Decimal("0.00"):
            payment = min(w, balance)
            balance = round2(balance - payment)
            events.append(
                ReferenceEvent(
                    date=current_date,
                    type="REFERENCE_PAYMENT",
                    amount=round2(payment),
                    balance=round2(balance),
                )
            )

        # Then apply 30-day interest
        if current_date in interest_dates and balance > Decimal("0.00"):
            interest = round2(balance * r)
            balance = round2(balance + interest)
            events.append(
                ReferenceEvent(
                    date=current_date,
                    type="30_DAY_INTEREST",
                    amount=round2(interest),
                    balance=round2(balance),
                )
            )

    return round2(balance), events


def find_weekly_reference_payment(
    loan_amount: Decimal | float | int,
    rate: Decimal | float | int,
    disbursement_date: date,
    term_months: int,
    tolerance: Decimal = Decimal("0.005"),
    max_iterations: int = 100,
) -> Decimal:
    """
    Binary search for the weekly reference amount that settles the projected balance by maturity.
    Matches Peter's worked example: KES 50,000 for 3 months @ 20% -> KES 5,612.82.
    """
    P = _to_d(loan_amount)
    r = _to_d(rate)

    low = Decimal("0.00")
    high = P * Decimal("3.00")

    for _ in range(max_iterations):
        mid = (low + high) / Decimal("2.00")
        balance, _ = simulate_microfinance_loan(
            loan_amount=P,
            rate=r,
            weekly_payment=mid,
            disbursement_date=disbursement_date,
            term_months=term_months,
        )

        if balance > tolerance:
            low = mid
        else:
            high = mid

    return round2(high)


def simulate_day_based_loan(
    loan_amount: Decimal | float | int,
    rate: Decimal | float | int,
    weekly_payment: Decimal | float | int,
    term_days: int = 91,
    interest_days: List[int] | None = None,
) -> Decimal:
    """
    Simulate loan day by day as defined in Section 5 of Peter's specification.
    """
    P = _to_d(loan_amount)
    r = _to_d(rate)
    w = _to_d(weekly_payment)

    if interest_days is None:
        interest_days = [day for day in range(30, term_days + 1, 30)]

    balance = round2(P * (_to_d(1) + r))

    for day in range(1, term_days + 1):
        if day % 7 == 0 and balance > Decimal("0.00"):
            balance = max(Decimal("0.00"), round2(balance - w))

        if day in interest_days and balance > Decimal("0.00"):
            balance = round2(balance * (_to_d(1) + r))

    return balance


def find_weekly_payment_day_based(
    loan_amount: Decimal | float | int,
    rate: Decimal | float | int,
    term_days: int = 91,
    interest_days: List[int] | None = None,
    tolerance: Decimal = Decimal("0.005"),
    max_iterations: int = 100,
) -> Decimal:
    """
    Binary search for weekly payment using exact term days.
    Matches Peter's worked example: KES 30,000 for 91 days @ 20% -> KES 3,367.69.
    """
    P = _to_d(loan_amount)
    r = _to_d(rate)

    low = Decimal("0.00")
    high = P * Decimal("2.00")

    for _ in range(max_iterations):
        mid = (low + high) / Decimal("2.00")
        bal = simulate_day_based_loan(
            loan_amount=P,
            rate=r,
            weekly_payment=mid,
            term_days=term_days,
            interest_days=interest_days,
        )

        if bal > tolerance:
            low = mid
        else:
            high = mid

    return round2(high)


def generate_full_reference_schedule(
    loan_amount: Decimal | float | int,
    rate: Decimal | float | int,
    disbursement_date: date,
    term_months: int,
) -> Dict[str, Any]:
    """
    Produces the complete reference schedule report including weekly installment,
    event breakdown, opening balance, and maturity date.
    """
    P = _to_d(loan_amount)
    r = _to_d(rate)
    weekly_inst = find_weekly_reference_payment(P, r, disbursement_date, term_months)
    balance, events = simulate_microfinance_loan(P, r, weekly_inst, disbursement_date, term_months)

    maturity_date = add_calendar_months(disbursement_date, term_months)
    opening_balance = round2(P * (_to_d(1) + r))
    initial_charge = round2(P * r)

    event_list: List[Dict[str, Any]] = []
    for e in events:
        event_list.append({
            "date": e.date.isoformat(),
            "type": e.type,
            "amount": str(e.amount),
            "balance": str(e.balance),
        })

    return {
        "loan_amount": str(round2(P)),
        "interest_rate": str(r),
        "initial_interest_charge": str(initial_charge),
        "opening_balance": str(opening_balance),
        "disbursement_date": disbursement_date.isoformat(),
        "maturity_date": maturity_date.isoformat(),
        "reference_weekly_installment": str(weekly_inst),
        "events": event_list,
    }


def get_loan_cycle_info(
    disbursement_date: date,
    query_date: date,
    cycle_days: int = 30,
) -> Dict[str, Any]:
    """
    Computes which 30-day cycle query_date falls into, its start and end dates.
    Cycle 1: [disbursement_date, disbursement_date + 30 days]
    Cycle 2: (disbursement_date + 30 days, disbursement_date + 60 days]
    """
    days_elapsed = (query_date - disbursement_date).days
    if days_elapsed < 0:
        days_elapsed = 0

    cycle_index = days_elapsed // cycle_days + 1
    cycle_start = disbursement_date + timedelta(days=(cycle_index - 1) * cycle_days)
    cycle_end = disbursement_date + timedelta(days=cycle_index * cycle_days)

    return {
        "cycle_index": cycle_index,
        "cycle_start": cycle_start,
        "cycle_end": cycle_end,
        "days_elapsed": days_elapsed,
    }


@dataclass
class JiinueSpecialScheduleEntry:
    period_number: int
    due_date: date
    expected_amount: Decimal
    expected_principal: Decimal
    expected_interest: Decimal
    opening_balance: Decimal
    closing_balance: Decimal


@dataclass
class JiinueSpecialPreScheduleResult:
    principal: Decimal
    monthly_interest_rate_pct: Decimal
    term_months: int
    num_weeks: int
    total_interest: Decimal
    total_payable: Decimal
    weekly_installment: Decimal
    weekly_principal: Decimal
    weekly_interest: Decimal
    monthly_interest_breakdown: List[Dict[str, Any]]
    schedule: List[JiinueSpecialScheduleEntry]


def calculate_jiinue_special_preschedule(
    principal: Decimal | float | int,
    interest_rate_pct: Decimal | float | int,
    num_periods: int,
    disbursement_date: date | None = None,
    term_months: int | None = None,
) -> JiinueSpecialPreScheduleResult:
    """
    Calculates the exact Loan Pre-Schedule (Loan Calculator) for Peter Irungu's
    'Jiinue Loan Special' Reducing Balance product (Image 1).

    Logic (handwritten Jiinue ledger):
    - Principal P at monthly rate r (e.g. 30,000 at 20% for 3 months = 12 weeks).
    - On disbursement, month-1 interest is added immediately: P * r (6,000), so the
      opening balance is P + interest (36,000).
    - Weekly payments are not a fixed installment. Each payment clears outstanding
      interest first, then reduces principal.
    - At each later month boundary (every 28 days), new interest = r × remaining
      principal is added. Month 2 and month 3 interest are therefore not known
      until the principal still outstanding at that boundary is known.
    - If any balance remains after the term, the loan is defaulted.
    """
    P = _to_d(principal)
    r_pct = _to_d(interest_rate_pct)
    r = r_pct / _to_d(100)

    if disbursement_date is None:
        disbursement_date = date.today()

    n = int(num_periods)
    if n <= 0:
        raise ValueError("num_periods must be positive.")

    # Determine tenor months and total weekly installments
    if term_months is not None and term_months > 0:
        M = int(term_months)
        W = M * 4 if n < 4 else n
    elif n < 4:
        # Caller passed months (e.g. 3) instead of weeks
        M = n
        W = M * 4
    else:
        # Caller passed number of weekly installments (e.g. 12)
        W = n
        M = max(1, int(round(Decimal(str(W)) / Decimal("4"))))

    # Opening balance includes month-1 interest. Later interest is a schedule
    # row on day 30, 60, ... calculated on the balance after payments so far.
    month1_interest = round2(P * r)
    term_days = W * 7
    weekly_inst = find_weekly_payment_day_based(P, r, term_days=term_days)
    balance = round2(P + month1_interest)
    total_interest = month1_interest
    monthly_breakdown: List[Dict[str, Any]] = [{
        "month": 1,
        "starting_principal": round2(P),
        "interest": month1_interest,
    }]
    weekly_prn = weekly_inst
    weekly_int = Decimal("0.00")

    schedule: List[JiinueSpecialScheduleEntry] = []
    curr_bal = total_payable
    accum_prn = Decimal("0.00")
    accum_int = Decimal("0.00")

    for w in range(1, W + 1):
        due = disbursement_date + timedelta(days=7 * w)

        if w == W:
            # Final period takes up any fractional cent discrepancies
            exp_prn = round2(P - accum_prn)
            exp_int = round2(total_interest - accum_int)
            exp_amt = round2(curr_bal)
            closing = Decimal("0.00")
        else:
            exp_prn = weekly_prn
            exp_int = weekly_int
            exp_amt = weekly_inst
            closing = round2(curr_bal - exp_amt)
            if closing < Decimal("0.00"):
                closing = Decimal("0.00")

        schedule.append(
            JiinueSpecialScheduleEntry(
                period_number=w,
                due_date=due,
                expected_amount=exp_amt,
                expected_principal=exp_prn,
                expected_interest=exp_int,
                opening_balance=round2(curr_bal),
                closing_balance=closing,
            )
        )
        accum_prn += exp_prn
        accum_int += exp_int
        curr_bal = closing

    return JiinueSpecialPreScheduleResult(
        principal=round2(P),
        monthly_interest_rate_pct=r_pct,
        term_months=M,
        num_weeks=W,
        total_interest=round2(total_interest),
        total_payable=total_payable,
        weekly_installment=weekly_inst,
        weekly_principal=weekly_prn,
        weekly_interest=weekly_int,
        monthly_interest_breakdown=monthly_breakdown,
        schedule=schedule,
    )


def jiinue_special_month_index(disbursement_date: date, as_of: date) -> int:
    """
    Month 1 runs from disbursement through day 28 (inclusive).
    Each following month is the next 28 days.
    21 Sep is month 1; 19 Oct (day 28) is still month 1; 26 Oct is month 2.
    """
    days = (as_of - disbursement_date).days
    if days <= 28:
        return 1
    return 1 + (days - 1) // 28


def capitalize_jiinue_special_interest(loan, as_of: date) -> Decimal:
    """
    Post each 30-day interest row once its date has arrived.
    The charge is the monthly rate times the balance still outstanding.
    Month-1 interest is already on the loan at disbursement.
    A row is already posted when paid_date is set.
    """
    disb = loan.disbursement_date
    if not disb or loan.principal_balance <= Decimal("0.01"):
        return Decimal("0.00")

    rate = _to_d(loan.interest_rate) / _to_d(100)
    added = Decimal("0.00")
    interest_rows = [
        entry
        for entry in loan.schedule_entries.all().order_by("due_date", "period_number")
        if entry.expected_amount == Decimal("0.00") and entry.expected_principal == Decimal("0.00")
    ]
    for entry in interest_rows:
        if entry.due_date > as_of or entry.paid_date is not None:
            continue
        base = round2(loan.principal_balance + loan.interest_balance)
        charge = round2(base * rate)
        if charge <= Decimal("0.00"):
            entry.paid_date = entry.due_date
            entry.save(update_fields=["paid_date"])
            continue
        entry.expected_interest = charge
        entry.opening_balance = base
        entry.closing_balance = round2(base + charge)
        entry.paid_date = entry.due_date
        entry.save(update_fields=["expected_interest", "opening_balance", "closing_balance", "paid_date"])
        loan.interest_balance = round2(loan.interest_balance + charge)
        added += charge

    if added > Decimal("0.00"):
        loan.outstanding_balance = round2(
            loan.principal_balance + loan.interest_balance + loan.fees_balance + loan.penalty_balance
        )
    return added


def check_loan_default_status(loan, as_of_date: date | None = None) -> bool:
    """
    Evaluates whether a loan should transition to defaulted status.
    Under Peter Irungu's specification:
    'If balance is greater than 0, the loan goes to defaulted status'
    at maturity / after the term expires.
    """
    from apps.loans.models import LoanStatus

    if as_of_date is None:
        from django.utils import timezone
        as_of_date = timezone.now().date()

    if loan.status in [LoanStatus.CLOSED, LoanStatus.WRITTEN_OFF, LoanStatus.REJECTED]:
        return False

    maturity = loan.maturity_date
    if not maturity and loan.schedule_entries.exists():
        maturity = loan.schedule_entries.order_by("due_date").last().due_date

    if maturity and as_of_date > maturity and loan.outstanding_balance > Decimal("0.01"):
        if loan.status != LoanStatus.DEFAULTED:
            loan.status = LoanStatus.DEFAULTED
            loan.save(update_fields=["status"])
            return True
    return False

