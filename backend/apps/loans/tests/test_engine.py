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
from apps.loans.services.engine.penalties import calculate_late_penalty
from apps.loans.services.engine.repayment import allocate_repayment_waterfall
from apps.loans.services.engine.aging import classify_loan_aging


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
