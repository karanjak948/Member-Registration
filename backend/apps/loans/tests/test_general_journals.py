from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.organizations.models import Organization
from apps.loans.models import LedgerAccount, LedgerTransaction, LedgerEntry

User = get_user_model()


class GeneralJournalEndpointsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="journal_tester",
            email="journal@royalsacco.co.ke",
            password="testpassword123",
            is_staff=True,
            is_superuser=True,
        )
        self.client.force_authenticate(user=self.user)

        self.org = Organization.objects.create(
            owner=self.user,
            name="Royal SACCO Limited",
            code="ROYAL-JV-TEST",
            email="info@royalsacco.co.ke",
            phone_number="254700000000",
            physical_address="Nairobi, Kenya",
        )

        self.cash_acc, _ = LedgerAccount.objects.get_or_create(
            account_code="1010",
            defaults={
                "account_name": "Cash and Bank Balances",
                "account_type": "asset",
                "is_active": True,
            },
        )
        self.stationary_acc, _ = LedgerAccount.objects.get_or_create(
            account_code="5010",
            defaults={
                "account_name": "Office Supplies & Stationery",
                "account_type": "expense",
                "is_active": True,
            },
        )
        self.equity_acc, _ = LedgerAccount.objects.get_or_create(
            account_code="3000",
            defaults={
                "account_name": "Opening Balance Equity",
                "account_type": "equity",
                "is_active": True,
            },
        )

    def test_next_jv_no_endpoint(self):
        url = "/api/v1/ledger-transactions/next-jv-no/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("jv_no", response.data)
        self.assertTrue(len(response.data["jv_no"]) > 0)

    def test_post_general_journal_success(self):
        url = "/api/v1/ledger-transactions/post-general-journal/"
        payload = {
            "money_from": {
                "account_id": self.cash_acc.id,
                "particular": "Stationery Purchase via Bank Transfer",
                "document_no": "DOC-ST-001",
                "transaction_date": "2026-09-17",
                "credit": "5500.00",
                "debit": "0.00",
            },
            "money_to": {
                "account_id": self.stationary_acc.id,
                "particular": "Stationery Purchase via Bank Transfer",
                "document_no": "DOC-ST-001",
                "transaction_date": "2026-09-17",
                "debit": "5500.00",
                "credit": "0.00",
            },
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("transaction", response.data)

        # Verify balanced ledger entries exist
        jv_no = response.data["transaction"].get("jv_no")
        entries = LedgerEntry.objects.filter(jv_no=jv_no)
        self.assertEqual(entries.count(), 2)

        dr_entry = entries.get(entry_type=LedgerEntry.EntryType.DEBIT)
        cr_entry = entries.get(entry_type=LedgerEntry.EntryType.CREDIT)

        self.assertEqual(dr_entry.account_id, self.stationary_acc.id)
        self.assertEqual(dr_entry.amount, Decimal("5500.00"))
        self.assertEqual(cr_entry.account_id, self.cash_acc.id)
        self.assertEqual(cr_entry.amount, Decimal("5500.00"))

    def test_post_general_journal_unbalanced_fails(self):
        url = "/api/v1/ledger-transactions/post-general-journal/"
        payload = {
            "money_from": {
                "account_id": self.cash_acc.id,
                "particular": "Unbalanced test",
                "credit": "4000.00",
            },
            "money_to": {
                "account_id": self.stationary_acc.id,
                "particular": "Unbalanced test",
                "debit": "5000.00",
            },
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_post_brought_forward_success(self):
        url = "/api/v1/ledger-transactions/post-brought-forward/"
        payload = {
            "account_id": self.cash_acc.id,
            "particular": "Bank Account Opening Balance as of 2026",
            "document_no": "BF-BANK-001",
            "transaction_date": "2026-01-01",
            "debit": "250000.00",
            "credit": "0.00",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])

        # Check entries: Debit Cash 250,000, Credit 3000 Opening Balance Equity 250,000
        cash_entry = LedgerEntry.objects.get(
            account=self.cash_acc,
            narration="Bank Account Opening Balance as of 2026",
        )
        self.assertEqual(cash_entry.entry_type, LedgerEntry.EntryType.DEBIT)
        self.assertEqual(cash_entry.amount, Decimal("250000.00"))

        equity_entry = LedgerEntry.objects.get(
            account=self.equity_acc,
            transaction=cash_entry.transaction,
        )
        self.assertEqual(equity_entry.entry_type, LedgerEntry.EntryType.CREDIT)
        self.assertEqual(equity_entry.amount, Decimal("250000.00"))

    def test_journal_entries_list_filters(self):
        # Create a journal entry first
        self.test_post_general_journal_success()

        url = "/api/v1/ledger-transactions/journal-entries-list/"
        response = self.client.get(url, {"account_no": self.cash_acc.account_code})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("entries", response.data)
        self.assertGreaterEqual(response.data["count"], 1)
        self.assertIn("total_credit", response.data)
        self.assertEqual(Decimal(str(response.data["total_credit"])), Decimal("5500.00"))
