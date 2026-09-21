from decimal import Decimal
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.members.models import Member
from apps.members.models.member_category import MemberCategory
from apps.organizations.models import Organization
from apps.loans.models import (
    Loan,
    LoanProduct,
    LoanStatus,
    InterestMethod,
    InterestPeriod,
    RepaymentFrequency,
)
from apps.loans.models.loan_schedule import LoanScheduleEntry
from apps.loans.serializers import RepaymentSerializer
from apps.loans.services.engine.microfinance import (
    calculate_jiinue_special_preschedule,
    check_loan_default_status,
)
from apps.loans.services.engine.schedule import generate_schedule

User = get_user_model()


class JiinueLoanSpecialTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="officer_peter",
            email="peter@example.com",
            password="password123",
        )
        self.org = Organization.objects.create(
            name="Royal SACCO",
            code="ROYAL",
            owner=self.user,
        )
        self.category = MemberCategory.objects.create(
            name="Standard",
            code="STD",
        )
        self.member = Member.objects.create(
            membership_number="MEM-JIN-001",
            first_name="Peter",
            other_names="Irungu",
            national_id="11223344",
            phone_number="0722000000",
            status="active",
            organization=self.org,
            category=self.category,
        )
        self.product = LoanProduct.objects.create(
            product_code="JIN-SPEC-001",
            product_name="Jiinue Loan Special",
            interest_method=InterestMethod.REDUCING_BALANCE,
            interest_rate=Decimal("20.0000"),
            interest_period=InterestPeriod.MONTHLY,
            repayment_frequency=RepaymentFrequency.WEEKLY,
            min_repayment_period=4,
            max_repayment_period=52,
            min_amount=Decimal("5000.00"),
            max_amount=Decimal("500000.00"),
            effective_date=date(2026, 1, 1),
            is_active=True,
            organization=self.org,
        )

    def test_image1_preschedule_exact_handwritten_breakdown(self):
        """
        Tests Peter Irungu's Image 1 Pre-Schedule / Loan Calculator:
        - Loan amount: 30,000
        - Period: 3 months, paid weekly (12 weeks)
        - Monthly interest rate: 20%
        - Month 1: 30,000 * 20% = 6,000
        - Month 2: 20,000 * 20% = 4,000
        - Month 3: 10,000 * 20% = 2,000
        - Total Interest = 12,000
        - Total Loan Plus Interest = 42,000
        - Weekly Installment = 42,000 / 12 = 3,500
          (Principal 2,500 + Shared Interest 1,000 = 3,500)
        - 12 rows stepping from 42,000 down to 0 balance.
        """
        applied_date = date(2026, 9, 17)
        res = calculate_jiinue_special_preschedule(
            principal=Decimal("30000.00"),
            interest_rate_pct=Decimal("20.00"),
            num_periods=12,
            disbursement_date=applied_date,
        )

        self.assertEqual(res.principal, Decimal("30000.00"))
        self.assertEqual(res.term_months, 3)
        self.assertEqual(res.num_weeks, 12)
        self.assertEqual(res.total_interest, Decimal("12000.00"))
        self.assertEqual(res.total_payable, Decimal("42000.00"))
        self.assertEqual(res.weekly_installment, Decimal("3500.00"))
        self.assertEqual(res.weekly_principal, Decimal("2500.00"))
        self.assertEqual(res.weekly_interest, Decimal("1000.00"))

        # Verify month by month breakdown
        self.assertEqual(len(res.monthly_interest_breakdown), 3)
        self.assertEqual(res.monthly_interest_breakdown[0]["starting_principal"], Decimal("30000.00"))
        self.assertEqual(res.monthly_interest_breakdown[0]["interest"], Decimal("6000.00"))
        self.assertEqual(res.monthly_interest_breakdown[1]["starting_principal"], Decimal("20000.00"))
        self.assertEqual(res.monthly_interest_breakdown[1]["interest"], Decimal("4000.00"))
        self.assertEqual(res.monthly_interest_breakdown[2]["starting_principal"], Decimal("10000.00"))
        self.assertEqual(res.monthly_interest_breakdown[2]["interest"], Decimal("2000.00"))

        # Verify weekly schedule entries match Peter's handwritten numbers
        expected_balances = [
            (1, Decimal("42000.00"), Decimal("3500.00"), Decimal("38500.00")),
            (2, Decimal("38500.00"), Decimal("3500.00"), Decimal("35000.00")),
            (3, Decimal("35000.00"), Decimal("3500.00"), Decimal("31500.00")),
            (4, Decimal("31500.00"), Decimal("3500.00"), Decimal("28000.00")),
            (5, Decimal("28000.00"), Decimal("3500.00"), Decimal("24500.00")),
            (6, Decimal("24500.00"), Decimal("3500.00"), Decimal("21000.00")),
            (7, Decimal("21000.00"), Decimal("3500.00"), Decimal("17500.00")),
            (8, Decimal("17500.00"), Decimal("3500.00"), Decimal("14000.00")),
            (9, Decimal("14000.00"), Decimal("3500.00"), Decimal("10500.00")),
            (10, Decimal("10500.00"), Decimal("3500.00"), Decimal("7000.00")),
            (11, Decimal("7000.00"), Decimal("3500.00"), Decimal("3500.00")),
            (12, Decimal("3500.00"), Decimal("3500.00"), Decimal("0.00")),
        ]

        self.assertEqual(len(res.schedule), 12)
        for i, (period, open_b, exp_amt, close_b) in enumerate(expected_balances):
            row = res.schedule[i]
            self.assertEqual(row.period_number, period)
            self.assertEqual(row.opening_balance, open_b)
            self.assertEqual(row.expected_amount, exp_amt)
            self.assertEqual(row.closing_balance, close_b)
            self.assertEqual(row.expected_principal, Decimal("2500.00"))
            self.assertEqual(row.expected_interest, Decimal("1000.00"))

    def test_generate_schedule_integrates_jiinue_special(self):
        """
        Verifies that generate_schedule routes reducing_balance + weekly + monthly to the pre-schedule.
        """
        sched = generate_schedule(
            principal=Decimal("30000.00"),
            interest_rate_pct=Decimal("20.00"),
            interest_period="monthly",
            interest_method="reducing_balance",
            repayment_frequency="weekly",
            num_periods=12,
            disbursement_date=date(2026, 9, 17),
        )
        self.assertEqual(len(sched), 12)
        total_interest = sum(e.expected_interest for e in sched)
        total_payable = sum(e.expected_amount for e in sched)
        self.assertEqual(total_interest, Decimal("12000.00"))
        self.assertEqual(total_payable, Decimal("42000.00"))
        self.assertEqual(sched[0].expected_amount, Decimal("3500.00"))

    def test_image2_and_3_actual_repayments_and_default_rule(self):
        """
        Tests Peter Irungu's Image 2 & 3:
        Loan of KES 30,000 @ 20% for 12 weeks.

        Pre-schedule:
        - Total interest = 30,000 * 20% * (3+1)/2 = 12,000
        - Total payable = 42,000
        - Weekly installment = 3,500 (2,500 principal + 1,000 interest)

        Actual repayments:
        - Each payment of 3,500 first covers 1,000 interest for that week then 2,500 to principal.
        - When more than 3,500 is paid in a week, excess 100% reduces principal.
        - After principal reduces, remaining schedule re-calculates with lower interest.

        Default Rule:
        - If loan balance > 0 after maturity date, status → DEFAULTED.
        """
        disb_date = date(2026, 9, 21)
        principal = Decimal("30000.00")
        num_periods = 12

        schedule = generate_schedule(
            principal=principal,
            interest_rate_pct=Decimal("20.00"),
            interest_period="monthly",
            interest_method="reducing_balance",
            repayment_frequency="weekly",
            num_periods=num_periods,
            disbursement_date=disb_date,
        )
        total_interest = sum(item.expected_interest for item in schedule)
        self.assertEqual(total_interest, Decimal("12000.00"))

        loan = Loan.objects.create(
            loan_number="LN-JIN-SPEC-001",
            member=self.member,
            loan_product=self.product,
            principal_amount=principal,
            num_periods=num_periods,
            interest_rate=Decimal("20.00"),
            interest_method="reducing_balance",
            repayment_frequency="weekly",
            status=LoanStatus.ACTIVE,
            organization=self.org,
            loan_officer=self.user,
            application_date=disb_date,
            disbursement_date=disb_date,
            maturity_date=schedule[-1].due_date,
            principal_balance=principal,
            interest_balance=total_interest,
            outstanding_balance=principal + total_interest,
            reference_weekly_installment=Decimal("3500.00"),
        )

        for s in schedule:
            LoanScheduleEntry.objects.create(
                loan=loan,
                period_number=s.period_number,
                due_date=s.due_date,
                expected_amount=s.expected_amount,
                expected_principal=s.expected_principal,
                expected_interest=s.expected_interest,
                opening_balance=s.opening_balance,
                closing_balance=s.closing_balance,
            )

        # Repayment 1: KES 3,500 (exact weekly installment) on Week 1 due date
        # Interest: 1,000, Principal: 2,500 → balance goes from 42,000 to 38,500
        r1 = RepaymentSerializer(data={
            "loan": loan.id,
            "amount_paid": "3500.00",
            "payment_date": schedule[0].due_date.isoformat(),
            "payment_method": "mpesa",
            "transaction_reference": "TXN_JIN_01",
        })
        self.assertTrue(r1.is_valid(), r1.errors)
        r1_rpy = r1.save()
        self.assertEqual(r1_rpy.allocated_interest, Decimal("1000.00"))
        self.assertEqual(r1_rpy.allocated_principal, Decimal("2500.00"))

        loan.refresh_from_db()
        self.assertEqual(loan.principal_balance, Decimal("27500.00"))
        self.assertLess(loan.outstanding_balance, Decimal("42000.00"))

        # Repayment 2: KES 7,000 (double payment) on Week 2 due date
        # Week 2 interest is from recalculated schedule on 27,500.
        # After paying 7,000: interest_week2 is covered, extra reduces principal further.
        r2 = RepaymentSerializer(data={
            "loan": loan.id,
            "amount_paid": "7000.00",
            "payment_date": schedule[1].due_date.isoformat(),
            "payment_method": "mpesa",
            "transaction_reference": "TXN_JIN_02",
        })
        self.assertTrue(r2.is_valid(), r2.errors)
        r2.save()

        loan.refresh_from_db()
        # After paying 3,500 + 7,000 = 10,500 total, principal should have reduced substantially
        self.assertLess(loan.principal_balance, Decimal("27500.00"))
        self.assertGreater(loan.outstanding_balance, Decimal("0.00"))

        # Check default rule: if balance > 0 after maturity, status becomes DEFAULTED
        past_maturity_date = loan.maturity_date + timedelta(days=2)
        is_defaulted = check_loan_default_status(loan, as_of_date=past_maturity_date)
        self.assertTrue(is_defaulted)
        loan.refresh_from_db()
        self.assertEqual(loan.status, LoanStatus.DEFAULTED)
