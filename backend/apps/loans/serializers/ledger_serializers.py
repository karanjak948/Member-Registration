from rest_framework import serializers
from apps.loans.models import LedgerAccount, LedgerTransaction, LedgerEntry


class LedgerEntrySerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source="account.account_code", read_only=True)
    account_name = serializers.CharField(source="account.account_name", read_only=True)
    account_type = serializers.CharField(source="account.account_type", read_only=True)

    class Meta:
        model = LedgerEntry
        fields = [
            "id",
            "account",
            "account_code",
            "account_name",
            "account_type",
            "entry_type",
            "amount",
            "narration",
        ]


class LedgerAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerAccount
        fields = [
            "id",
            "account_code",
            "account_name",
            "account_type",
            "is_active",
            "description",
            "organization",
        ]


class LedgerTransactionSerializer(serializers.ModelSerializer):
    entries = LedgerEntrySerializer(many=True, read_only=True)
    loan_number = serializers.CharField(source="loan.loan_number", read_only=True)

    class Meta:
        model = LedgerTransaction
        fields = [
            "id",
            "transaction_number",
            "transaction_date",
            "description",
            "reference_type",
            "reference_id",
            "loan",
            "loan_number",
            "entries",
            "created_at",
        ]
