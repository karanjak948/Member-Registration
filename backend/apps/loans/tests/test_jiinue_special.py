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
        self.assertEqual(len(res.schedule), 12)
        # Period 1 starts at 36,000 with 6,000 month 1 interest
        self.assertEqual(res.schedule[0].period_number, 1)
        self.assertEqual(res.schedule[0].opening_balance, Decimal("36000.00"))
        self.assertEqual(res.schedule[0].expected_interest, Decimal("6000.00"))
        self.assertEqual(res.schedule[0].closing_balance, Decimal("30000.00"))

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
        self.assertEqual(total_interest, Decimal("12000.00"))
        self.assertEqual(sched[0].opening_balance, Decimal("36000.00"))
        self.assertEqual(sched[0].expected_interest, Decimal("6000.00"))
        self.assertEqual(sched[0].closing_balance, Decimal("30000.00"))

    def test_image2_and_3_actual_repayments_and_default_rule(self):
        """
        Tests Peter Irungu's exact Image 1, 2 & 3 scenario (LN-000031):
        - Loan taken 30,000 at 20% interest rate for 3 months (12 weeks).
        - Month 1: Principal 30,000, Interest 6,000, Loan Balance 36,000.
        - Payment 1 (28/09/26): Paid 6,000 -> Allocated Interest: 6,000, Principal: 0.
          Loan Balance becomes 30,000.
        - Payment 2 (05/10/26): Paid 3,000 -> Allocated Interest: 0, Principal: 3,000.
          Loan Balance becomes 27,000.
        - Default Rule:
          If balance > 0 after maturity, status becomes DEFAULTED.
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

        initial_cycle_interest = Decimal("6000.00")
        opening_balance = principal + initial_cycle_interest

        loan = Loan.objects.create(
            loan_number="LN-000031",
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
            interest_balance=initial_cycle_interest,
            outstanding_balance=opening_balance,
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

        # Repayment 1 (Peter's 6,000 payment on LN-000031):
        # Covers Month 1 interest in full (6,000 interest, 0 principal).
        # Outstanding balance reduces from 36,000 to 30,000.
        r1 = RepaymentSerializer(data={
            "loan": loan.id,
            "amount_paid": "6000.00",
            "payment_date": disb_date.isoformat(),
            "payment_method": "mpesa",
            "transaction_reference": "TXN-1790150852148",
        })
        self.assertTrue(r1.is_valid(), r1.errors)
        r1_rpy = r1.save()
        self.assertEqual(r1_rpy.allocated_interest, Decimal("6000.00"))
        self.assertEqual(r1_rpy.allocated_principal, Decimal("0.00"))

        loan.refresh_from_db()
        self.assertEqual(loan.interest_balance, Decimal("0.00"))
        self.assertEqual(loan.principal_balance, Decimal("30000.00"))
        self.assertEqual(loan.outstanding_balance, Decimal("30000.00"))
        self.assertEqual(loan.total_interest_paid, Decimal("6000.00"))
        self.assertEqual(loan.total_principal_paid, Decimal("0.00"))

        # Verify Schedule row 1 closing balance is 30,000 and status is Paid
        s1 = loan.schedule_entries.get(period_number=1)
        self.assertTrue(s1.is_paid)
        self.assertEqual(s1.paid_interest, Decimal("6000.00"))
        self.assertEqual(s1.paid_principal, Decimal("0.00"))
        self.assertEqual(s1.closing_balance, Decimal("30000.00"))

        # Repayment 2: KES 3,000 on 05/10/26 (Image 1):
        # Month 1 interest is already 0, so 100% reduces principal!
        # Balance reduces from 30,000 to 27,000.
        r2 = RepaymentSerializer(data={
            "loan": loan.id,
            "amount_paid": "3000.00",
            "payment_date": (disb_date + timedelta(days=14)).isoformat(),
            "payment_method": "mpesa",
            "transaction_reference": "TXN_JIN_02",
        })
        self.assertTrue(r2.is_valid(), r2.errors)
        r2_rpy = r2.save()
        self.assertEqual(r2_rpy.allocated_interest, Decimal("0.00"))
        self.assertEqual(r2_rpy.allocated_principal, Decimal("3000.00"))

        loan.refresh_from_db()
        self.assertEqual(loan.interest_balance, Decimal("0.00"))
        self.assertEqual(loan.principal_balance, Decimal("27000.00"))
        self.assertEqual(loan.outstanding_balance, Decimal("27000.00"))
        self.assertEqual(loan.total_principal_paid, Decimal("3000.00"))

        # Check default rule: if balance > 0 after maturity, status becomes DEFAULTED
        past_maturity_date = loan.maturity_date + timedelta(days=2)
        is_defaulted = check_loan_default_status(loan, as_of_date=past_maturity_date)
        self.assertTrue(is_defaulted)
        loan.refresh_from_db()
        self.assertEqual(loan.status, LoanStatus.DEFAULTED)

