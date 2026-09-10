from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
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


class MpesaRelayVerificationTestCase(TestCase):
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

        self.member = Member.objects.create(
            first_name="Peter",
            other_names="Mwangi",
            national_id="12345678",
            phone_number="0712345678",
            status=Member.MemberStatus.ACTIVE,
            registration_stage=Member.RegistrationStage.ACTIVE,
            category=self.category,
            organization=self.org,
            membership_number="RC-00123",
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
            loan_number="LN-000123",
            member=self.member,
            loan_product=self.product,
            organization=self.org,
            principal_amount=Decimal("50000.00"),
            approved_amount=Decimal("50000.00"),
            disbursed_amount=Decimal("50000.00"),
            principal_balance=Decimal("50000.00"),
            interest_balance=Decimal("3000.00"),
            fees_balance=Decimal("0.00"),
            penalty_balance=Decimal("0.00"),
            outstanding_balance=Decimal("53000.00"),
            interest_rate=Decimal("12.00"),
            interest_method="reducing_balance",
            repayment_frequency="monthly",
            num_periods=12,
            application_date="2026-09-01",
            disbursement_date="2026-09-01",
            status=LoanStatus.ACTIVE,
        )

        LoanScheduleEntry.objects.create(
            loan=self.loan,
            period_number=1,
            due_date="2026-10-10",
            expected_amount=Decimal("4666.67"),
            expected_principal=Decimal("4166.67"),
            expected_interest=Decimal("500.00"),
            opening_balance=Decimal("50000.00"),
            closing_balance=Decimal("45833.33"),
        )

        self.confirmation_url = "/api/v1/mpesa/c2b/confirmation/"

        # Peter's exact relay payload structure
        self.sample_relay_payload = {
            "unique_serial": 1548,
            "verify_url": "https://system.royalltd.co.ke/payments/verifypayment",
            "paymentPayload": {
                "TransactionType": "Pay Bill",
                "TransID": "QK12345678",
                "TransTime": "20260910143022",
                "TransAmount": "2500.00",
                "BusinessShortCode": "868352",
                "BillRefNumber": "LN-000123",
                "InvoiceNumber": "",
                "OrgAccountBalance": "150000.00",
                "ThirdPartyTransID": "",
                "MSISDN": "254712345678",
                "FirstName": "PETER",
                "MiddleName": "KAMAU",
                "LastName": "MWANGI",
            },
        }

    @override_settings(ROYAL_PAYMENTS_API_KEY="test-secret-key-xyz")
    @patch("requests.post")
    def test_relay_verification_success(self, mock_post):
        """
        Relay payload with valid X-API-Key and successful verify callback
        allocates the repayment to the loan and sets status to COMPLETED.
        """
        # Mock the external verify response
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "status": "success",
            "unique_serial": 1548,
            "paymentPayload": {
                "TransID": "QK12345678",
                "TransAmount": "2500.00",
            },
        }
        mock_post.return_value = mock_resp

        response = self.client.post(
            self.confirmation_url,
            self.sample_relay_payload,
            format="json",
            HTTP_X_API_KEY="test-secret-key-xyz",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("ResultCode"), 0)
        self.assertEqual(response.data.get("status"), MpesaTransactionStatus.COMPLETED)

        # Verify outgoing verify call
        mock_post.assert_called_once()
        called_args, called_kwargs = mock_post.call_args
        self.assertEqual(called_args[0], "https://system.royalltd.co.ke/payments/verifypayment")
        self.assertEqual(called_kwargs["json"], {"unique_serial": 1548})
        self.assertEqual(called_kwargs["headers"].get("X-API-Key"), "test-secret-key-xyz")

        # Verify DB transaction record
        tx = MpesaTransaction.objects.get(trans_id="QK12345678")
        self.assertEqual(tx.status, MpesaTransactionStatus.COMPLETED)
        self.assertEqual(tx.unique_serial, "1548")
        self.assertEqual(tx.verify_url, "https://system.royalltd.co.ke/payments/verifypayment")
        self.assertTrue(tx.is_verified)
        self.assertEqual(tx.trans_amount, Decimal("2500.00"))
        self.assertEqual(tx.loan, self.loan)
        self.assertEqual(tx.member, self.member)
        self.assertIsNotNone(tx.repayment)

        # Verify repayment and loan balance update
        repayment = Repayment.objects.get(transaction_reference="QK12345678")
        self.assertEqual(repayment.amount_paid, Decimal("2500.00"))
        self.loan.refresh_from_db()
        self.assertEqual(self.loan.outstanding_balance, Decimal("50500.00"))

    @override_settings(ROYAL_PAYMENTS_API_KEY="test-secret-key-xyz")
    def test_relay_unauthorized_api_key(self):
        """
        Request with incorrect X-API-Key must be rejected with 401 Unauthorized.
        """
        response = self.client.post(
            self.confirmation_url,
            self.sample_relay_payload,
            format="json",
            HTTP_X_API_KEY="wrong-api-key",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("error", response.data)
        # Ensure nothing was stored or credited
        self.assertEqual(MpesaTransaction.objects.count(), 0)
        self.assertEqual(Repayment.objects.count(), 0)

    @override_settings(ROYAL_PAYMENTS_API_KEY="test-secret-key-xyz")
    @patch("requests.post")
    def test_relay_verification_http_failure(self, mock_post):
        """
        When verify_url returns HTTP 400/500, transaction is recorded as
        VERIFICATION_FAILED and NO repayment or loan balance deduction occurs.
        """
        mock_resp = MagicMock()
        mock_resp.status_code = 404
        mock_resp.text = "Serial not found"
        mock_post.return_value = mock_resp

        response = self.client.post(
            self.confirmation_url,
            self.sample_relay_payload,
            format="json",
            HTTP_X_API_KEY="test-secret-key-xyz",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get("ResultCode"), 1)

        # Verify transaction logged with VERIFICATION_FAILED
        tx = MpesaTransaction.objects.get(trans_id="QK12345678")
        self.assertEqual(tx.status, MpesaTransactionStatus.VERIFICATION_FAILED)
        self.assertFalse(tx.is_verified)
        self.assertIsNone(tx.repayment)

        # Assert no repayment created & loan balance untouched
        self.assertEqual(Repayment.objects.filter(transaction_reference="QK12345678").count(), 0)
        self.loan.refresh_from_db()
        self.assertEqual(self.loan.outstanding_balance, Decimal("53000.00"))

    @override_settings(ROYAL_PAYMENTS_API_KEY="test-secret-key-xyz")
    @patch("requests.post")
    def test_relay_payload_mismatch_fails(self, mock_post):
        """
        When verify_url returns data that doesn't match the TransID or amount,
        the transaction must fail without crediting the loan.
        """
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "status": "success",
            "paymentPayload": {
                "TransID": "DIFFERENT_TRANS_ID",
                "TransAmount": "9999.00",
            },
        }
        mock_post.return_value = mock_resp

        response = self.client.post(
            self.confirmation_url,
            self.sample_relay_payload,
            format="json",
            HTTP_X_API_KEY="test-secret-key-xyz",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get("ResultCode"), 1)

        tx = MpesaTransaction.objects.get(trans_id="QK12345678")
        self.assertEqual(tx.status, MpesaTransactionStatus.VERIFICATION_FAILED)
        self.assertFalse(tx.is_verified)
        self.assertIsNone(tx.repayment)

        self.assertEqual(Repayment.objects.count(), 0)
        self.loan.refresh_from_db()
        self.assertEqual(self.loan.outstanding_balance, Decimal("53000.00"))

    def test_direct_daraja_c2b_without_relay_wrapper(self):
        """
        Direct Safaricom Daraja confirmation without relay wrapper continues
        to work as before (backward compatibility).
        """
        direct_payload = {
            "TransactionType": "Pay Bill",
            "TransID": "DIRECT001",
            "TransTime": "20260910150000",
            "TransAmount": "1000.00",
            "BusinessShortCode": "868352",
            "BillRefNumber": "LN-000123",
            "MSISDN": "254712345678",
            "FirstName": "PETER",
        }

        response = self.client.post(self.confirmation_url, direct_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"ResultCode": 0, "ResultDesc": "Accepted"})

        tx = MpesaTransaction.objects.get(trans_id="DIRECT001")
        self.assertEqual(tx.status, MpesaTransactionStatus.COMPLETED)
        self.assertTrue(tx.is_verified)
        self.assertIsNotNone(tx.repayment)
