from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.loans.models import LedgerAccount, LedgerTransaction, LedgerEntry

User = get_user_model()


class LedgerDeletionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="adminuser",
            email="admin@royalsacco.co.ke",
            password="password123",
            is_staff=True,
            is_superuser=True,
        )
        self.client.force_authenticate(user=self.user)

        self.account_cash = LedgerAccount.objects.create(
            account_code="1010",
            account_name="Cash and Bank Balances",
            account_type="asset",
            is_active=True,
        )
        self.account_income = LedgerAccount.objects.create(
            account_code="4100",
            account_name="Loan Processing Fee Income",
            account_type="revenue",
            is_active=True,
        )
        self.account_unused = LedgerAccount.objects.create(
            account_code="9999",
            account_name="Temporary Unused Account",
            account_type="asset",
            is_active=True,
        )

        self.transaction = LedgerTransaction.objects.create(
            transaction_number="TXN-TEST-001",
            transaction_date="2026-09-09",
            description="Test entry for deletion",
            reference_type="FEE",
            reference_id="FEE-001",
        )
        self.entry_dr = LedgerEntry.objects.create(
            transaction=self.transaction,
            account=self.account_cash,
            entry_type=LedgerEntry.EntryType.DEBIT,
            amount=Decimal("1500.00"),
        )
        self.entry_cr = LedgerEntry.objects.create(
            transaction=self.transaction,
            account=self.account_income,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount=Decimal("1500.00"),
        )

    def test_delete_ledger_transaction_cascades_entries(self):
        txn_id = self.transaction.id
        response = self.client.delete(f"/api/ledger-transactions/{txn_id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(LedgerTransaction.objects.filter(id=txn_id).exists())
        self.assertFalse(LedgerEntry.objects.filter(transaction_id=txn_id).exists())

    def test_delete_ledger_account_with_entries_is_blocked(self):
        response = self.client.delete(f"/api/ledger-accounts/{self.account_cash.id}/")
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)
        self.assertTrue(response.data.get("can_deactivate"))
        self.assertTrue(LedgerAccount.objects.filter(id=self.account_cash.id).exists())

    def test_delete_unused_ledger_account_succeeds(self):
        response = self.client.delete(f"/api/ledger-accounts/{self.account_unused.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(LedgerAccount.objects.filter(id=self.account_unused.id).exists())

    def test_normal_user_cannot_delete_ledger_transaction(self):
        normal_user = User.objects.create_user(
            username="normaluser",
            email="normal@royalsacco.co.ke",
            password="password123",
            is_staff=False,
            is_superuser=False,
        )
        self.client.force_authenticate(user=normal_user)
        response = self.client.delete(f"/api/ledger-transactions/{self.transaction.id}/")
        self.assertEqual(response.status_code, 403)
        self.assertIn("error", response.data)
        self.assertTrue(LedgerTransaction.objects.filter(id=self.transaction.id).exists())

    def test_normal_user_cannot_delete_ledger_account(self):
        normal_user = User.objects.create_user(
            username="normaluser2",
            email="normal2@royalsacco.co.ke",
            password="password123",
            is_staff=False,
            is_superuser=False,
        )
        self.client.force_authenticate(user=normal_user)
        response = self.client.delete(f"/api/ledger-accounts/{self.account_unused.id}/")
        self.assertEqual(response.status_code, 403)
        self.assertIn("error", response.data)
        self.assertTrue(LedgerAccount.objects.filter(id=self.account_unused.id).exists())

    def test_normal_user_cannot_modify_ledger_account(self):
        normal_user = User.objects.create_user(
            username="normaluser3",
            email="normal3@royalsacco.co.ke",
            password="password123",
            is_staff=False,
            is_superuser=False,
        )
        self.client.force_authenticate(user=normal_user)
        response = self.client.patch(f"/api/ledger-accounts/{self.account_unused.id}/", {"is_active": False})
        self.assertEqual(response.status_code, 403)
        self.assertIn("error", response.data)

