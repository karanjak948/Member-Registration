from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.organizations.models import Organization
from apps.members.models import Member
from apps.loans.models import LedgerAccount, LedgerTransaction, LedgerEntry
from apps.shares.models import SharePayment
from apps.shares.serializers import SharePaymentCreateSerializer

User = get_user_model()


class SharesManagementTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testadmin",
            email="admin@royalsacco.co.ke",
            password="adminpassword123",
            is_staff=True,
            is_superuser=True,
        )

        self.org = Organization.objects.create(
            owner=self.user,
            name="Royal SACCO Limited",
            code="ROYAL-TEST",
            email="info@royalsacco.co.ke",
            phone_number="254700000000",
            physical_address="Nairobi, Kenya",
        )

        self.member = Member.objects.create(
            organization=self.org,
            first_name="Peter",
            other_names="Irungu",
            membership_number="RC-10025",
            national_id="32145698",
            phone_number="254712345678",
            status="ACTIVE",
        )

        # Setup ledger accounts
        self.cash_account, _ = LedgerAccount.objects.get_or_create(
            account_code="1010",
            defaults={
                "account_name": "Cash and Bank Balances",
                "account_type": "asset",
                "is_active": True,
            },
        )
        self.share_account, _ = LedgerAccount.objects.get_or_create(
            account_code="3010",
            defaults={
                "account_name": "Member Share Capital",
                "account_type": "equity",
                "is_active": True,
            },
        )

    def test_create_share_payment_with_gl_posting(self):
        """
        Verify creating a share payment automatically posts balanced entries to General Ledger.
        """
        data = {
            "member": self.member.id,
            "document_no": "100021",
            "share_type": "ordinary",
            "number_of_shares": "25",
            "share_price": "100.00",
            "payment_mode": "mpesa",
            "transaction_no": "SHR9876543",
            "paid_on": timezone.now().date(),
            "paid_by": "Peter Irungu",
            "remarks": "Purchase of 25 Ordinary Shares",
        }

        serializer = SharePaymentCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        payment = serializer.save()

        # Check total amount calculation (25 * 100 = 2500)
        self.assertEqual(payment.total_amount, Decimal("2500.00"))
        self.assertEqual(payment.document_no, "100021")

        # Check General Ledger transaction created
        gl_tx = LedgerTransaction.objects.filter(reference_type="SHARES", reference_id="100021").first()
        self.assertIsNotNone(gl_tx)

        entries = list(gl_tx.entries.all())
        self.assertEqual(len(entries), 2)

        debit_entry = gl_tx.entries.filter(entry_type=LedgerEntry.EntryType.DEBIT).first()
        credit_entry = gl_tx.entries.filter(entry_type=LedgerEntry.EntryType.CREDIT).first()

        self.assertIsNotNone(debit_entry)
        self.assertIsNotNone(credit_entry)

        # Debit Cash/Bank (1010)
        self.assertEqual(debit_entry.account.account_code, "1010")
        self.assertEqual(debit_entry.amount, Decimal("2500.00"))

        # Credit Member Share Capital (3010)
        self.assertEqual(credit_entry.account.account_code, "3010")
        self.assertEqual(credit_entry.amount, Decimal("2500.00"))

    def test_auto_document_number_generation(self):
        """
        Verify document_no is automatically generated if not supplied.
        """
        payment = SharePayment.objects.create(
            organization=self.org,
            member=self.member,
            share_type="capital",
            number_of_shares=Decimal("10"),
            share_price=Decimal("500.00"),
            total_amount=Decimal("5000.00"),
            payment_mode="cash",
            paid_on=timezone.now().date(),
        )

        self.assertTrue(bool(payment.document_no))
        self.assertTrue(int(payment.document_no) >= 100001)
