from rest_framework import viewsets, permissions, filters
from apps.loans.models import LedgerAccount, LedgerTransaction
from apps.loans.serializers import (
    LedgerAccountSerializer,
    LedgerTransactionSerializer,
)


class LedgerAccountViewSet(viewsets.ModelViewSet):
    """
    Chart of Accounts management API.
    """
    queryset = LedgerAccount.objects.all()
    serializer_class = LedgerAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["account_code", "account_name", "account_type"]
    ordering_fields = ["account_code", "account_type", "created_at"]
    ordering = ["account_code"]


class LedgerTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only view for general ledger journal entries.
    """
    queryset = LedgerTransaction.objects.all().prefetch_related("entries", "entries__account").select_related("loan")
    serializer_class = LedgerTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["transaction_number", "reference_type", "reference_id", "loan__loan_number"]
    ordering_fields = ["transaction_date", "created_at"]
    ordering = ["-transaction_date", "-created_at"]
