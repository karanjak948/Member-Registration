import unittest
from datetime import date
from decimal import Decimal
from apps.loans.services.engine.interest import (
    calculate_flat_interest,
    calculate_reducing_balance_schedule,
    calculate_compound_interest,
    round2,
)
from apps.loans.services.engine.schedule import generate_schedule
from apps.loans.services.engine.fees import calculate_fee
from apps.loans.services.engine.repayment import allocate_repayment_waterfall
from apps.loans.services.engine.aging import classify_loan_aging
from apps.loans.services.engine.microfinance import (
    simulate_microfinance_loan,
    find_weekly_reference_payment,
    find_weekly_payment_day_based,
    generate_full_reference_schedule,
    get_loan_cycle_info,
)


class LoanEngineMathTests(unittest.TestCase):
    def test_flat_interest(self):
        # Principal: 100,000, 12% per year (1% per month), 12 months
        result = calculate_flat_interest(
            principal=100000,
            interest_rate_pct=1.0,
            num_periods=12,
            interest_period="monthly",
            repayment_frequency="monthly",
        )
        self.assertEqual(result.total_interest, Decimal("12000.00"))
        self.assertEqual(result.total_payable, Decimal("112000.00"))
        self.assertEqual(result.interest_per_period, Decimal("1000.00"))

    def test_reducing_balance_schedule(self):
        # Principal: 50,000, 1.25% per month, 6 months
        schedule = calculate_reducing_balance_schedule(
            principal=50000,
            interest_rate_pct=1.25,
            num_periods=6,
            interest_period="monthly",
            repayment_frequency="monthly",
        )
        self.assertEqual(len(schedule), 6)
        # Verify opening balance of first installment is principal
        self.assertEqual(schedule[0].opening_balance, Decimal("50000.00"))
        # Verify closing balance of last installment is exactly 0
        self.assertEqual(schedule[-1].closing_balance, Decimal("0.00"))
        # Total principal paid across all installments must sum to 50,000
        total_principal = sum(row.principal_component for row in schedule)
        self.assertEqual(round2(total_principal), Decimal("50000.00"))

    def test_sacco_straight_line_reducing_balance_no_909(self):
        # Scenario from user: KES 100,000, 2 months, 20% monthly rate
        # Month 1: 100,000 * 20% = 20,000 interest, 50,000 principal
        # Month 2: 50,000 * 20% = 10,000 interest, 50,000 principal
        # Total Interest MUST be exactly KES 30,000.00 (not 30,909.09)
        schedule = calculate_reducing_balance_schedule(
            principal=100000,
            interest_rate_pct=20,
            num_periods=2,
            interest_period="monthly",
            repayment_frequency="monthly",
        )
        self.assertEqual(len(schedule), 2)
        self.assertEqual(schedule[0].interest_charge, Decimal("20000.00"))
        self.assertEqual(schedule[0].principal_component, Decimal("50000.00"))
        self.assertEqual(schedule[1].interest_charge, Decimal("10000.00"))
        self.assertEqual(schedule[1].principal_component, Decimal("50000.00"))
        total_interest = sum(row.interest_charge for row in schedule)
        self.assertEqual(total_interest, Decimal("30000.00"))
        total_payable = sum(row.installment for row in schedule)
        self.assertEqual(total_payable, Decimal("130000.00"))

    def test_schedule_generator_dates(self):
        disbursement = date(2026, 1, 1)
        schedule = generate_schedule(
            principal=10000,
            interest_rate_pct=10,
            interest_period="yearly",
            interest_method="reducing_balance",
            repayment_frequency="monthly",
            num_periods=3,
            disbursement_date=disbursement,
        )
        self.assertEqual(len(schedule), 3)
        self.assertEqual(schedule[0].due_date, date(2026, 2, 1))
        self.assertEqual(schedule[1].due_date, date(2026, 3, 1))
        self.assertEqual(schedule[2].due_date, date(2026, 4, 1))

    def test_fee_calculations(self):
        fee = calculate_fee(
            fee_name="Processing Fee",
            fee_type="percentage",
            fee_value=2.5,
            fee_basis="principal",
            principal=200000,
        )
        self.assertEqual(fee.calculated_amount, Decimal("5000.00"))

        fixed = calculate_fee(
            fee_name="Appraisal Fee",
            fee_type="fixed_amount",
            fee_value=1500,
        )
        self.assertEqual(fixed.calculated_amount, Decimal("1500.00"))

    def test_repayment_waterfall_allocation(self):
        # Case: Repayment of 15,000 against due penalty: 500, fees: 1,000, interest: 3,500, principal: 100,000
        alloc = allocate_repayment_waterfall(
            payment_amount=15000,
            outstanding_penalty=500,
            outstanding_fees=1000,
            outstanding_interest=3500,
            outstanding_principal=100000,
            allocation_order="penalty,fees,interest,principal",
        )
        self.assertEqual(alloc.allocated_penalty, Decimal("500.00"))
        self.assertEqual(alloc.allocated_fees, Decimal("1000.00"))
        self.assertEqual(alloc.allocated_interest, Decimal("3500.00"))
        self.assertEqual(alloc.allocated_principal, Decimal("10000.00"))
        self.assertEqual(alloc.remaining_unallocated, Decimal("0.00"))
        self.assertEqual(alloc.total_allocated, Decimal("15000.00"))

    def test_aging_classification(self):
        # 0 days overdue = current
        c1 = classify_loan_aging(0, 100000)
        self.assertEqual(c1.category, "current")

        # 15 days overdue = watchful
        c2 = classify_loan_aging(15, 100000)
        self.assertEqual(c2.category, "watchful")

        # 45 days overdue = non_performing
        c3 = classify_loan_aging(45, 100000)
        self.assertEqual(c3.category, "non_performing")

        # 120 days overdue = doubtful
        c4 = classify_loan_aging(120, 100000)
        self.assertEqual(c4.category, "doubtful")

        # 200 days overdue = loss
        c5 = classify_loan_aging(200, 100000)
        self.assertEqual(c5.category, "loss")
        self.assertEqual(c5.provision_amount, Decimal("100000.00"))

    def test_peter_worked_example_50k_3months(self):
        """
        Peter Irungu's Worked Example (Section 5):
        KES 50,000 for 3 months @ 20% every 30 days.
        Disbursed: 16 Sep 2026, Maturity: 16 Dec 2026.
        Weekly reference installment must equal KES 5,612.82.
        """
        loan_amount = Decimal("50000.00")
        rate = Decimal("0.20")
        disbursement_date = date(2026, 9, 16)
        term_months = 3

        weekly = find_weekly_reference_payment(
            loan_amount=loan_amount,
            rate=rate,
            disbursement_date=disbursement_date,
            term_months=term_months,
        )
        self.assertEqual(weekly, Decimal("5612.82"))

        # Verify simulation events
        final_balance, events = simulate_microfinance_loan(
            loan_amount=loan_amount,
            rate=rate,
            weekly_payment=weekly,
            disbursement_date=disbursement_date,
            term_months=term_months,
        )
        self.assertLessEqual(final_balance, Decimal("0.01"))

        # Verify interest events count and payment events count
        interest_events = [e for e in events if e.type == "30_DAY_INTEREST"]
        payment_events = [e for e in events if e.type == "REFERENCE_PAYMENT"]
        self.assertEqual(len(interest_events), 3)
        self.assertEqual(len(payment_events), 13)

        # Verify specific dates from Peter's schedule:
        # Day 30 interest on 16 Oct 2026: Amount = 7,509.74, Balance = 45,058.46
        e_oct16 = [e for e in events if e.date == date(2026, 10, 16) and e.type == "30_DAY_INTEREST"][0]
        self.assertEqual(e_oct16.amount, Decimal("7509.74"))
        self.assertEqual(e_oct16.balance, Decimal("45058.46"))

    def test_peter_worked_example_30k_91days(self):
        """
        Peter Irungu's Worked Example (Section 6):
        KES 30,000 loan, 20% initial charge at disbursement, 20% on days 30, 60, 90,
        weekly payments on days 7, 14, ... 91 -> KES 3,367.69.
        """
        loan_amount = Decimal("30000.00")
        rate = Decimal("0.20")
        weekly = find_weekly_payment_day_based(
            loan_amount=loan_amount,
            rate=rate,
            term_days=91,
        )
        # Peter's specification states: "approximately KES 3,367.69" (3,367.69 - 3,367.70)
        self.assertAlmostEqual(float(weekly), 3367.69, delta=0.02)

    def test_peter_borrower_simulations_clients_abc(self):
        """
        Peter Irungu's Section 7: Three Borrower Examples (Client A, Client B, Client C).
        30,000 loan, 20% every 30 days (days 30, 60, 90). Opening balance = 36,000.
        """
        # Client A: Regular payer (KES 2,800 every 7 days)
        # Total paid: KES 36,400.00 | Balance after Day 91: KES 10,486.40
        balance_a = Decimal("36000.00")
        for day in range(1, 92):
            if day % 7 == 0:
                balance_a -= Decimal("2800.00")
            if day in (30, 60, 90) and balance_a > 0:
                balance_a = round2(balance_a * Decimal("1.20"))
        self.assertEqual(round2(balance_a), Decimal("10486.40"))

        # Client B: Irregular payer (pays more)
        # Day 7,14,21: 2000 | Day 28,35,42,49: 5000 | Day 56: 2000 | Day 63,70: 2000 | Day 77,84: 5000 | Day 91: 1920
        # Total paid: 47,000.00 | Balance after Day 91: KES 0.00
        balance_b = Decimal("36000.00")
        payments_b = {
            7: Decimal("2000.00"), 14: Decimal("2000.00"), 21: Decimal("2000.00"), 28: Decimal("5000.00"),
            35: Decimal("5000.00"), 42: Decimal("5000.00"), 49: Decimal("5000.00"), 56: Decimal("2000.00"),
            63: Decimal("2000.00"), 70: Decimal("2000.00"), 77: Decimal("5000.00"), 84: Decimal("5000.00"),
            91: Decimal("1920.00"),
        }
        for day in range(1, 92):
            if day in payments_b:
                balance_b -= payments_b[day]
            if day in (30, 60, 90) and balance_b > 0:
                balance_b = round2(balance_b * Decimal("1.20"))
        self.assertEqual(round2(balance_b), Decimal("0.00"))

        # Client C: Underpayer (KES 1,500 every 7 days)
        # Total paid: KES 19,500.00 | Balance after Day 91: KES 34,500.00
        balance_c = Decimal("36000.00")
        for day in range(1, 92):
            if day % 7 == 0:
                balance_c -= Decimal("1500.00")
            if day in (30, 60, 90) and balance_c > 0:
                balance_c = round2(balance_c * Decimal("1.20"))
        self.assertEqual(round2(balance_c), Decimal("34500.00"))

    def test_peter_whatsapp_scenario_cycle_repayment_math(self):
        """
        Peter Irungu's WhatsApp Scenario:
        KES 30k loan, 3 months @ 20%.
        1. Opening balance: 30k principal + 6k month 1 interest = 36k.
        2. Pay 20k in Month 1: 6k interest first, 14k principal reduction.
           Principal balance becomes 30 - 14 = 16k.
        3. Pay 5k in the SAME month: 0 interest deducted!
           Principal balance reduced from 16k to 11k (or 14k to 9k).
        4. Next month interest: 20% on remaining principal (e.g. 20% of 9k = 1,800).
        5. Early clearing in Month 1: 30k principal + 6k interest = 36k total.
        """
        principal = Decimal("30000.00")
        rate = Decimal("0.20")
        month1_interest = round2(principal * rate)
        self.assertEqual(month1_interest, Decimal("6000.00"))

        # Payment 1 of 20,000 in Month 1
        payment1 = Decimal("20000.00")
        alloc1 = allocate_repayment_waterfall(
            payment_amount=payment1,
            outstanding_interest=month1_interest,
            outstanding_principal=principal,
            allocation_order="interest,principal",
        )
        self.assertEqual(alloc1.allocated_interest, Decimal("6000.00"))
        self.assertEqual(alloc1.allocated_principal, Decimal("14000.00"))
        principal_rem_1 = principal - alloc1.allocated_principal
        self.assertEqual(principal_rem_1, Decimal("16000.00"))

        # Payment 2 of 5,000 in the SAME month (cycle interest already satisfied = 0)
        payment2 = Decimal("5000.00")
        alloc2 = allocate_repayment_waterfall(
            payment_amount=payment2,
            outstanding_interest=Decimal("0.00"),  # No interest in same cycle!
            outstanding_principal=principal_rem_1,
            allocation_order="interest,principal",
        )
        self.assertEqual(alloc2.allocated_interest, Decimal("0.00"))
        self.assertEqual(alloc2.allocated_principal, Decimal("5000.00"))
        principal_rem_2 = principal_rem_1 - alloc2.allocated_principal
        self.assertEqual(principal_rem_2, Decimal("11000.00"))

        # In Peter's 9k remaining example: Month 2 interest is 20% of 9,000 = 1,800
        rem_p = Decimal("9000.00")
        month2_interest = round2(rem_p * rate)
        self.assertEqual(month2_interest, Decimal("1800.00"))
        payoff_month2 = rem_p + month2_interest
        self.assertEqual(payoff_month2, Decimal("10800.00"))

        # Early payoff in Month 1: 30,000 + 6,000 = 36,000
        payoff_month1 = principal + month1_interest
        self.assertEqual(payoff_month1, Decimal("36000.00"))

