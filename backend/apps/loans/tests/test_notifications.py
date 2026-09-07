import unittest
from decimal import Decimal
from unittest.mock import patch, MagicMock

from apps.common.sms_service import BulkSMSService
from apps.common.notification_service import NotificationService, _format_curr


class MockMember:
    def __init__(self, first_name="Kelvin", other_names="Karanja", phone_number="0712345678"):
        self.first_name = first_name
        self.other_names = other_names
        self.phone_number = phone_number


class MockLoanProduct:
    def __init__(self, product_name="Development Loan"):
        self.product_name = product_name


class MockLoan:
    def __init__(
        self,
        loan_number="LN-000042",
        principal_amount=Decimal("150000.00"),
        outstanding_balance=Decimal("150000.00"),
        num_periods=12,
        first_name="Kelvin",
        other_names="Karanja",
        phone_number="0712345678",
        product_name="Development Loan",
    ):
        self.loan_number = loan_number
        self.principal_amount = principal_amount
        self.outstanding_balance = outstanding_balance
        self.num_periods = num_periods
        self.member = MockMember(first_name, other_names, phone_number)
        self.loan_product = MockLoanProduct(product_name)
        self.schedule_entries = MagicMock()
        self.schedule_entries.order_by.return_value.first.return_value = None


class MockRepayment:
    def __init__(
        self,
        loan,
        amount_paid=Decimal("15250.00"),
        payment_date="2026-09-07",
        transaction_reference="MPESA123456",
        repayment_number="RPY-001",
    ):
        self.loan = loan
        self.amount_paid = amount_paid
        self.payment_date = payment_date
        self.transaction_reference = transaction_reference
        self.repayment_number = repayment_number


class SMSNotificationTests(unittest.TestCase):
    def test_phone_number_formatting(self):
        # 10 digits starting with 0
        self.assertEqual(BulkSMSService.format_phone_number("0712345678"), "254712345678")
        self.assertEqual(BulkSMSService.format_phone_number("0112345678"), "254112345678")
        # 9 digits without 0
        self.assertEqual(BulkSMSService.format_phone_number("712345678"), "254712345678")
        # 12 digits with 254
        self.assertEqual(BulkSMSService.format_phone_number("254712345678"), "254712345678")
        # With symbols/spaces
        self.assertEqual(BulkSMSService.format_phone_number("+254 712 345 678"), "254712345678")

    def test_currency_formatting(self):
        self.assertEqual(_format_curr(150000), "150,000.00")
        self.assertEqual(_format_curr(Decimal("2500000.50")), "2,500,000.50")
        self.assertEqual(_format_curr("1234.5"), "1,234.50")

    @patch.object(NotificationService, "_dispatch_and_log")
    def test_loan_application_notification(self, mock_dispatch):
        mock_dispatch.return_value = {"success": True}
        loan = MockLoan()

        NotificationService.notify_loan_application(loan)

        mock_dispatch.assert_called_once()
        args, kwargs = mock_dispatch.call_args
        self.assertEqual(kwargs["phone_number"], "0712345678")
        self.assertIn("LN-000042", kwargs["message"])
        self.assertIn("KES 150,000.00", kwargs["message"])
        self.assertIn("Development Loan", kwargs["message"])
        self.assertIn("under review", kwargs["message"])

    @patch.object(NotificationService, "_dispatch_and_log")
    def test_loan_approval_notification(self, mock_dispatch):
        mock_dispatch.return_value = {"success": True}
        loan = MockLoan()

        NotificationService.notify_loan_approval(loan)

        mock_dispatch.assert_called_once()
        args, kwargs = mock_dispatch.call_args
        self.assertIn("APPROVED", kwargs["message"])
        self.assertIn("KES 150,000.00", kwargs["message"])
        self.assertIn("LN-000042", kwargs["message"])

    @patch.object(NotificationService, "_dispatch_and_log")
    def test_loan_disbursement_notification_with_installment(self, mock_dispatch):
        mock_dispatch.return_value = {"success": True}
        loan = MockLoan()

        NotificationService.notify_loan_disbursement(
            loan=loan,
            installment_amount=Decimal("15250.00"),
            first_due_date="2026-10-05",
        )

        mock_dispatch.assert_called_once()
        args, kwargs = mock_dispatch.call_args
        self.assertIn("DISBURSED", kwargs["message"])
        self.assertIn("KES 150,000.00", kwargs["message"])
        self.assertIn("Monthly installment: KES 15,250.00", kwargs["message"])
        self.assertIn("first due on 2026-10-05", kwargs["message"])

    @patch.object(NotificationService, "_dispatch_and_log")
    def test_repayment_confirmation_notification(self, mock_dispatch):
        mock_dispatch.return_value = {"success": True}
        loan = MockLoan()
        repayment = MockRepayment(loan=loan, amount_paid=Decimal("15250.00"))

        NotificationService.notify_repayment(
            repayment=repayment,
            remaining_balance=Decimal("134750.00"),
        )

        mock_dispatch.assert_called_once()
        args, kwargs = mock_dispatch.call_args
        self.assertIn("KES 15,250.00", kwargs["message"])
        self.assertIn("Ref: MPESA123456", kwargs["message"])
        self.assertIn("Outstanding balance: KES 134,750.00", kwargs["message"])

    @patch.object(NotificationService, "_dispatch_and_log")
    def test_loan_completion_notification(self, mock_dispatch):
        mock_dispatch.return_value = {"success": True}
        loan = MockLoan()

        NotificationService.notify_loan_completion(loan)

        mock_dispatch.assert_called_once()
        args, kwargs = mock_dispatch.call_args
        self.assertIn("FULLY REPAID and closed", kwargs["message"])
        self.assertIn("LN-000042", kwargs["message"])

    @patch.object(NotificationService, "_dispatch_and_log")
    def test_overdue_delinquency_notification(self, mock_dispatch):
        mock_dispatch.return_value = {"success": True}
        loan = MockLoan()

        NotificationService.notify_overdue_loan(
            loan=loan,
            days_overdue=21,
            overdue_amount=Decimal("30500.00"),
        )

        mock_dispatch.assert_called_once()
        args, kwargs = mock_dispatch.call_args
        self.assertIn("overdue by 21 days", kwargs["message"])
        self.assertIn("KES 30,500.00", kwargs["message"])
        self.assertIn("avoid penalties", kwargs["message"])


if __name__ == "__main__":
    unittest.main()
