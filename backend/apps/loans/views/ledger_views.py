from uuid import uuid4
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.loans.models import LedgerAccount, LedgerTransaction, LedgerEntry
from apps.loans.serializers import (
    LedgerAccountSerializer,
    LedgerTransactionSerializer,
)
from apps.organizations.permissions import is_admin_or_owner_user


class LedgerAccountViewSet(viewsets.ModelViewSet):
    """
    Chart of Accounts management API.
    Restricts creation, updates, and deletion to Admins and Owners.
    """
    queryset = LedgerAccount.objects.all()
    serializer_class = LedgerAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["account_code", "account_name", "account_type"]
    ordering_fields = ["account_code", "account_type", "created_at"]
    ordering = ["account_code"]

    def create(self, request, *args, **kwargs):
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can create ledger accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can modify ledger accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can modify ledger accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deleting accounts that have linked ledger entries.
        Allow deactivation instead. Admin/Owner only.
        """
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can delete ledger accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        account = self.get_object()
        entry_count = account.entries.count()
        if entry_count > 0:
            return Response(
                {
                    "error": (
                        f"Cannot delete account '{account.account_code} - {account.account_name}' "
                        f"because it has {entry_count} linked transaction entries. "
                        "You can mark it Inactive instead to preserve audit integrity."
                    ),
                    "can_deactivate": True,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class LedgerTransactionViewSet(viewsets.ModelViewSet):
    """
    General ledger journal entries and manual income posting.
    Supports administrative deletion/voiding of transactions (Admin/Owner only).
    """
    queryset = LedgerTransaction.objects.all().prefetch_related("entries", "entries__account").select_related("loan")
    serializer_class = LedgerTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["transaction_number", "reference_type", "reference_id", "loan__loan_number", "description"]
    ordering_fields = ["transaction_date", "created_at"]
    ordering = ["-transaction_date", "-created_at"]

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """
        Administrative void/delete of a journal transaction and its entries.
        Restricted to Admins and Owners.
        """
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can void or delete ledger transactions."},
                status=status.HTTP_403_FORBIDDEN,
            )
        txn = self.get_object()
        txn.entries.all().delete()
        txn.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=False, methods=["post"], url_path="post-income")
    @transaction.atomic
    def post_income(self, request):
        """
        Post income transaction (fees, security deposits, interest, penalties)
        balanced against Cash/Bank (1010).
        """
        account_id = request.data.get("account_id")
        amount = request.data.get("amount")
        description = request.data.get("description", "").strip()
        reference_no = request.data.get("reference_no", "").strip()
        reference_type = request.data.get("reference_type", "INCOME").upper()
        transaction_date = request.data.get("transaction_date") or timezone.now().date()

        if not account_id or not amount:
            return Response(
                {"error": "account_id and amount are required fields."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_account = LedgerAccount.objects.get(id=account_id)
        except LedgerAccount.DoesNotExist:
            return Response(
                {"error": f"Ledger account #{account_id} does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            parsed_amount = Decimal(str(amount))
            if parsed_amount <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            return Response(
                {"error": "Amount must be a positive number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cash_account, _ = LedgerAccount.objects.get_or_create(
            account_code="1010",
            defaults={
                "account_name": "Cash and Bank Balances",
                "account_type": "asset",
                "is_active": True,
            },
        )

        txn_number = f"GL-INC-{uuid4().hex[:8].upper()}"
        journal_txn = LedgerTransaction.objects.create(
            transaction_number=txn_number,
            transaction_date=transaction_date,
            description=description or f"{target_account.account_name} payment received",
            reference_type=reference_type,
            reference_id=reference_no or txn_number,
        )

        # Debit Cash/Bank
        LedgerEntry.objects.create(
            transaction=journal_txn,
            account=cash_account,
            entry_type=LedgerEntry.EntryType.DEBIT,
            amount=parsed_amount,
            narration=f"Cash receipt for {target_account.account_name}",
        )

        # Credit Income / Liability Account
        LedgerEntry.objects.create(
            transaction=journal_txn,
            account=target_account,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount=parsed_amount,
            narration=description or f"Receipt reference {reference_no}",
        )

        serializer = self.get_serializer(journal_txn)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
