from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.loans.models import (
    Loan,
    LoanProduct,
    LoanScheduleEntry,
    LoanStatus,
    MpesaTransaction,
    MpesaTransactionStatus,
    Repayment,
)
from apps.members.models.member import Member
from apps.members.models.member_category import MemberCategory
from apps.organizations.models import Organization

User = get_user_model()


class MpesaC2BIntegrationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username="officer",
            email="officer@sacco.co.ke",
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

        # Member with National ID matching Peter's sample payload "26954308"
        self.member = Member.objects.create(
            first_name="Samuel",
            other_names="Mwangi",
            national_id="26954308",
            phone_number="0700000670",
            status=Member.MemberStatus.ACTIVE,
            registration_stage=Member.RegistrationStage.ACTIVE,
            category=self.category,
            organization=self.org,
            membership_number="RC-00101",
        )

        self.product = LoanProduct.objects.create(
            product_code="LP-STD",
            product_name="Standard Loan",
            effective_date="2026-01-01",
            interest_rate=Decimal("12.00"),
            interest_period="yearly",
            interest_method="reducing_balance",
            repayment_frequency="monthly",
            min_amount=Decimal("1000.00"),
            max_amount=Decimal("500000.00"),
            max_repayment_period=12,
            organization=self.org,
            allocation_order="penalty,fees,interest,principal",
        )

        self.loan = Loan.objects.create(
            loan_number="LN-000101",
            member=self.member,
            loan_product=self.product,
            organization=self.org,
            principal_amount=Decimal("20000.00"),
            approved_amount=Decimal("20000.00"),
            disbursed_amount=Decimal("20000.00"),
            principal_balance=Decimal("20000.00"),
            interest_balance=Decimal("1300.00"),
            fees_balance=Decimal("0.00"),
            penalty_balance=Decimal("0.00"),
            outstanding_balance=Decimal("21300.00"),
            interest_rate=Decimal("12.00"),
            interest_method="reducing_balance",
            repayment_frequency="monthly",
            num_periods=12,
            application_date="2026-09-01",
            disbursement_date="2026-09-01",
            status=LoanStatus.ACTIVE,
        )

        # Add initial schedule entry
        LoanScheduleEntry.objects.create(
            loan=self.loan,
            period_number=1,
            due_date="2026-10-10",
            expected_amount=Decimal("1775.00"),
            expected_principal=Decimal("1666.67"),
            expected_interest=Decimal("108.33"),
            opening_balance=Decimal("20000.00"),
            closing_balance=Decimal("18333.33"),
        )

        self.confirmation_url = "/api/v1/mpesa/c2b/confirmation/"
        self.validation_url = "/api/v1/mpesa/c2b/validation/"

    def test_c2b_confirmation_with_peters_payload(self):
        """
        Verify Peter's exact JSON payload matching a member by BillRefNumber (National ID).
        """
        payload = {
            "TransactionType": "Pay Bill",
            "TransID": "UIATRT7PD",
            "TransTime": "20260910124208",
            "TransAmount": "10.00",
            "BusinessShortCode": "673649",
            "BillRefNumber": "26954308",
            "InvoiceNumber": "",
            "OrgAccountBalance": "110.00",
            "ThirdPartyTransID": "",
            "MSISDN": "254700000670",
            "FirstName": "SAMUEL",
        }

        response = self.client.post(self.confirmation_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"ResultCode": 0, "ResultDesc": "Accepted"})

        # Check transaction record
        tx = MpesaTransaction.objects.get(trans_id="UIATRT7PD")
        self.assertEqual(tx.status, MpesaTransactionStatus.COMPLETED)
        self.assertEqual(tx.trans_amount, Decimal("10.00"))
        self.assertEqual(tx.member, self.member)
        self.assertEqual(tx.loan, self.loan)
        self.assertIsNotNone(tx.repayment)

        # Check loan repayment creation & balance update
        repayment = Repayment.objects.get(transaction_reference="UIATRT7PD")
        self.assertEqual(repayment.amount_paid, Decimal("10.00"))
        self.assertEqual(repayment.payment_method, "mpesa")
        self.loan.refresh_from_db()
        self.assertEqual(self.loan.outstanding_balance, Decimal("21290.00"))

    def test_c2b_confirmation_idempotency(self):
        """
        Sending the same TransID twice should not double-credit the loan.
        """
        payload = {
            "TransactionType": "Pay Bill",
            "TransID": "IDEMPOTENT001",
            "TransTime": "20260910124208",
            "TransAmount": "500.00",
            "BusinessShortCode": "673649",
            "BillRefNumber": "26954308",
            "MSISDN": "254700000670",
            "FirstName": "SAMUEL",
        }

        # First call
        res1 = self.client.post(self.confirmation_url, payload, format="json")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(Repayment.objects.filter(transaction_reference="IDEMPOTENT001").count(), 1)

        initial_balance = Loan.objects.get(id=self.loan.id).outstanding_balance

        # Duplicate call
        res2 = self.client.post(self.confirmation_url, payload, format="json")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data, {"ResultCode": 0, "ResultDesc": "Accepted"})

        # Verify no duplicate repayment and no double deduction
        self.assertEqual(Repayment.objects.filter(transaction_reference="IDEMPOTENT001").count(), 1)
        self.loan.refresh_from_db()
        self.assertEqual(self.loan.outstanding_balance, initial_balance)

    def test_c2b_confirmation_direct_loan_number_match(self):
        """
        Verify matching directly when BillRefNumber is the loan number.
        """
        payload = {
            "TransactionType": "Pay Bill",
            "TransID": "LOANREF002",
            "TransTime": "20260910130000",
            "TransAmount": "1000.00",
            "BusinessShortCode": "673649",
            "BillRefNumber": "LN-000101",
            "MSISDN": "254799999999",
            "FirstName": "JOHN",
        }

        response = self.client.post(self.confirmation_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        tx = MpesaTransaction.objects.get(trans_id="LOANREF002")
        self.assertEqual(tx.status, MpesaTransactionStatus.COMPLETED)
        self.assertEqual(tx.loan, self.loan)

    def test_c2b_confirmation_unallocated_when_ref_unrecognized(self):
        """
        Unrecognized reference numbers should still be accepted (ResultCode: 0)
        and saved with UNALLOCATED status for manual staff reconciliation.
        """
        payload = {
            "TransactionType": "Pay Bill",
            "TransID": "UNKNOWN003",
            "TransTime": "20260910130000",
            "TransAmount": "250.00",
            "BusinessShortCode": "673649",
            "BillRefNumber": "SOME_UNKNOWN_REF",
            "MSISDN": "254711111111",
            "FirstName": "MYSTERY",
        }

        response = self.client.post(self.confirmation_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"ResultCode": 0, "ResultDesc": "Accepted"})

        tx = MpesaTransaction.objects.get(trans_id="UNKNOWN003")
        self.assertEqual(tx.status, MpesaTransactionStatus.UNALLOCATED)
        self.assertIsNone(tx.loan)
        self.assertIsNone(tx.repayment)

    def test_c2b_validation_endpoint(self):
        """
        Verify validation endpoint accepts incoming requests with ResultCode 0.
        """
        payload = {
            "TransactionType": "Pay Bill",
            "TransID": "VAL001",
            "TransTime": "20260910124208",
            "TransAmount": "10.00",
            "BusinessShortCode": "673649",
            "BillRefNumber": "26954308",
            "MSISDN": "254700000670",
        }

        response = self.client.post(self.validation_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"ResultCode": 0, "ResultDesc": "Accepted"})

    def test_manual_allocation_action(self):
        """
        Verify manual allocation of an UNALLOCATED transaction to an active loan.
        """
        tx = MpesaTransaction.objects.create(
            trans_id="MANUAL004",
            transaction_type="Pay Bill",
            trans_time="2026-09-10T12:00:00Z",
            trans_amount=Decimal("300.00"),
            business_short_code="673649",
            bill_ref_number="MISSPELLED",
            msisdn="254711111111",
            raw_payload={},
            status=MpesaTransactionStatus.UNALLOCATED,
        )

        self.client.force_authenticate(user=self.user)
        allocate_url = f"/api/v1/mpesa/transactions/{tx.id}/allocate/"
        res = self.client.post(allocate_url, {"loan_id": self.loan.id}, format="json")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.status, MpesaTransactionStatus.COMPLETED)
        self.assertEqual(tx.loan, self.loan)
        self.assertIsNotNone(tx.repayment)
