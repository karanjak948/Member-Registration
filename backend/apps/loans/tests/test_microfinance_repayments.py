from decimal import Decimal
from datetime import date, timedelta
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.members.models import Member
from apps.members.models.member_category import MemberCategory
from apps.organizations.models import Organization
from apps.loans.models import Loan, LoanProduct, LoanStatus, InterestMethod, InterestPeriod, RepaymentFrequency
from apps.loans.serializers import RepaymentSerializer
from apps.loans.services.engine.schedule import generate_schedule
from apps.loans.models.loan_schedule import LoanScheduleEntry

User = get_user_model()


class MicrofinanceRepaymentIntegrationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testofficer",
            email="testofficer@example.com",
            password="password123",
        )
        self.org = Organization.objects.create(
            name="Test SACCO",
            code="TSACCO",
            owner=self.user,
        )
        self.category = MemberCategory.objects.create(
            name="Normal Members",
            code="NORMAL",
        )
        self.member = Member.objects.create(
            membership_number="MEM-TEST-001",
            first_name="Kelvin",
            other_names="Borrower",
            national_id="99887766",
            phone_number="0712345678",
            status="active",
            organization=self.org,
            category=self.category,
        )
        self.product = LoanProduct.objects.create(
            product_code="JIN-001",
            product_name="Jiinue Loan",
            interest_method=InterestMethod.REDUCING_BALANCE,
            interest_rate=Decimal("20.00"),
            interest_period=InterestPeriod.MONTHLY,
            repayment_frequency=RepaymentFrequency.MONTHLY,
            min_repayment_period=1,
            max_repayment_period=12,
            min_amount=Decimal("1000.00"),
            max_amount=Decimal("500000.00"),
            effective_date=date(2026, 1, 1),
            is_active=True,
            organization=self.org,
        )

    def test_peter_30k_repayments_intra_month_and_settlement(self):
        disb_date = date(2026, 9, 16)
        principal = Decimal("30000.00")
        num_periods = 3

        # Generate initial schedule
        schedule = generate_schedule(
            principal=principal,
            interest_rate_pct=Decimal("20.00"),
            interest_period="monthly",
            interest_method="reducing_balance",
            repayment_frequency="monthly",
            num_periods=num_periods,
            disbursement_date=disb_date,
        )
        total_interest = sum(item.expected_interest for item in schedule)

        loan = Loan.objects.create(
            loan_number="LN-TEST-30K",
            member=self.member,
            loan_product=self.product,
            principal_amount=principal,
            num_periods=num_periods,
            interest_rate=Decimal("20.00"),
            interest_method="reducing_balance",
            repayment_frequency="monthly",
            status=LoanStatus.ACTIVE,
            organization=self.org,
            loan_officer=self.user,
            application_date=disb_date,
            disbursement_date=disb_date,
            maturity_date=schedule[-1].due_date,
            principal_balance=principal,
            interest_balance=total_interest,
            outstanding_balance=principal + total_interest,
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

        # -------------------------------------------------------------
        # 1. Repayment 1: KES 20,000 paid on 25 Sep 2026 (inside Month 1)
        # -------------------------------------------------------------
        # Expected: 6,000 covers Month 1 interest; 14,000 reduces principal.
        # Principal balance becomes 30,000 - 14,000 = 16,000.
        rpy1_serializer = RepaymentSerializer(
            data={
                "loan": loan.id,
                "amount_paid": "20000.00",
                "payment_date": "2026-09-25",
                "payment_method": "mpesa",
                "transaction_reference": "MPESA_REF_01",
            }
        )
        self.assertTrue(rpy1_serializer.is_valid(), rpy1_serializer.errors)
        rpy1 = rpy1_serializer.save()

        self.assertEqual(rpy1.allocated_interest, Decimal("6000.00"))
        self.assertEqual(rpy1.allocated_principal, Decimal("14000.00"))

        loan.refresh_from_db()
        self.assertEqual(loan.principal_balance, Decimal("16000.00"))
        # Period 1 is completed
        p1_entry = loan.schedule_entries.get(period_number=1)
        self.assertTrue(p1_entry.is_paid)
        self.assertEqual(p1_entry.paid_interest, Decimal("6000.00"))

        # -------------------------------------------------------------
        # 2. Repayment 2: KES 5,000 paid on 30 Sep 2026 (SAME MONTH)
        # -------------------------------------------------------------
        # Expected: Month 1 interest is already satisfied.
        # ZERO interest deducted! 100% of 5,000 reduces principal from 16,000 to 11,000.
        rpy2_serializer = RepaymentSerializer(
            data={
                "loan": loan.id,
                "amount_paid": "5000.00",
                "payment_date": "2026-09-30",
                "payment_method": "mpesa",
                "transaction_reference": "MPESA_REF_02",
            }
        )
        self.assertTrue(rpy2_serializer.is_valid(), rpy2_serializer.errors)
        rpy2 = rpy2_serializer.save()

        self.assertEqual(rpy2.allocated_interest, Decimal("0.00"))
        self.assertEqual(rpy2.allocated_principal, Decimal("5000.00"))

        loan.refresh_from_db()
        self.assertEqual(loan.principal_balance, Decimal("11000.00"))

        # -------------------------------------------------------------
        # 3. Payoff / Early Settlement of remaining 11,000
        # -------------------------------------------------------------
        # Clearing the loan in Month 1 with 11,000
        rpy3_serializer = RepaymentSerializer(
            data={
                "loan": loan.id,
                "amount_paid": "11000.00",
                "payment_date": "2026-10-05",
                "payment_method": "mpesa",
                "transaction_reference": "MPESA_REF_03",
                "is_early_settlement": True,
            }
        )
        self.assertTrue(rpy3_serializer.is_valid(), rpy3_serializer.errors)
        rpy3 = rpy3_serializer.save()

        self.assertEqual(rpy3.allocated_interest, Decimal("0.00"))
        self.assertEqual(rpy3.allocated_principal, Decimal("11000.00"))

        loan.refresh_from_db()
        self.assertEqual(loan.principal_balance, Decimal("0.00"))
        self.assertEqual(loan.interest_balance, Decimal("0.00"))
        self.assertEqual(loan.outstanding_balance, Decimal("0.00"))
        self.assertEqual(loan.status, LoanStatus.CLOSED)

    def test_peter_30k_month2_repayment_and_payoff(self):
        """
        Tests Month 2 rollover:
        - Loan 30k, Month 1 pays 20k, then 5k (balance down to 11k, or if 14k->9k).
        - Rolls over to Month 2 (payment date: Oct 20, 2026).
        - Interest for Month 2 is 20% on remaining principal: 20% of 11k = 2,200.
        - Member pays 13,200 to clear the loan: 2,200 interest + 11,000 principal.
        - Loan is closed, Month 3 is waived.
        """
        disb_date = date(2026, 9, 16)
        principal = Decimal("30000.00")
        num_periods = 3

        schedule = generate_schedule(
            principal=principal,
            interest_rate_pct=Decimal("20.00"),
            interest_period="monthly",
            interest_method="reducing_balance",
            repayment_frequency="monthly",
            num_periods=num_periods,
            disbursement_date=disb_date,
        )
        total_interest = sum(item.expected_interest for item in schedule)

        loan = Loan.objects.create(
            loan_number="LN-TEST-M2",
            member=self.member,
            loan_product=self.product,
            principal_amount=principal,
            num_periods=num_periods,
            interest_rate=Decimal("20.00"),
            interest_method="reducing_balance",
            repayment_frequency="monthly",
            status=LoanStatus.ACTIVE,
            organization=self.org,
            loan_officer=self.user,
            application_date=disb_date,
            disbursement_date=disb_date,
            maturity_date=schedule[-1].due_date,
            principal_balance=principal,
            interest_balance=total_interest,
            outstanding_balance=principal + total_interest,
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

        # Repayment 1 in Month 1: 20,000
        s1 = RepaymentSerializer(
            data={
                "loan": loan.id,
                "amount_paid": "20000.00",
                "payment_date": "2026-09-25",
                "payment_method": "mpesa",
                "transaction_reference": "REF_M2_01",
            }
        )
        self.assertTrue(s1.is_valid(), s1.errors)
        s1.save()

        # Repayment 2 in Month 1: 5,000 (same month) -> principal drops to 11,000
        s2 = RepaymentSerializer(
            data={
                "loan": loan.id,
                "amount_paid": "5000.00",
                "payment_date": "2026-09-30",
                "payment_method": "mpesa",
                "transaction_reference": "REF_M2_02",
            }
        )
        self.assertTrue(s2.is_valid(), s2.errors)
        s2.save()

        loan.refresh_from_db()
        self.assertEqual(loan.principal_balance, Decimal("11000.00"))

        # Repayment 3 in Month 2: On Oct 20, 2026 (after Month 1 due date Oct 16)
        # Interest due for Month 2 is 20% of 11,000 = 2,200.
        # Clearing with 13,200 (2,200 interest + 11,000 principal).
        s3 = RepaymentSerializer(
            data={
                "loan": loan.id,
                "amount_paid": "13200.00",
                "payment_date": "2026-10-20",
                "payment_method": "mpesa",
                "transaction_reference": "REF_M2_03",
            }
        )
        self.assertTrue(s3.is_valid(), s3.errors)
        rpy_m2 = s3.save()

        self.assertEqual(rpy_m2.allocated_interest, Decimal("2200.00"))
        self.assertEqual(rpy_m2.allocated_principal, Decimal("11000.00"))

        loan.refresh_from_db()
        self.assertEqual(loan.principal_balance, Decimal("0.00"))
        self.assertEqual(loan.interest_balance, Decimal("0.00"))
        self.assertEqual(loan.outstanding_balance, Decimal("0.00"))
        self.assertEqual(loan.status, LoanStatus.CLOSED)

