from decimal import Decimal
from uuid import uuid4
from rest_framework import serializers
from apps.savings.models import SavingsPayment
from apps.members.models import Member
from apps.loans.models import LedgerAccount, LedgerTransaction, LedgerEntry


class SavingsPaymentSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for viewing savings payments in registers and tables.
    """
    member_name = serializers.SerializerMethodField()
    membership_number = serializers.CharField(source="member.membership_number", read_only=True)
    member_phone = serializers.CharField(source="member.phone_number", read_only=True)
    money_in = serializers.SerializerMethodField()
    money_out = serializers.SerializerMethodField()
    savings_type_display = serializers.CharField(source="get_savings_type_display", read_only=True)
    payment_mode_display = serializers.CharField(source="get_payment_mode_display", read_only=True)
    recorded_by_username = serializers.CharField(source="recorded_by.username", read_only=True)

    class Meta:
        model = SavingsPayment
        fields = [
            "id",
            "organization",
            "member",
            "member_name",
            "membership_number",
            "member_phone",
            "document_no",
            "savings_type",
            "savings_type_display",
            "transaction_type",
            "amount",
            "money_in",
            "money_out",
            "currency",
            "payment_mode",
            "payment_mode_display",
            "bank_name",
            "transaction_no",
            "paid_on",
            "paid_by",
            "week",
            "month",
            "year",
            "remarks",
            "is_reversed",
            "reversed_at",
            "reversal_reason",
            "recorded_by",
            "recorded_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_reversed", "reversed_at", "reversal_reason", "created_at", "updated_at"]


    def get_member_name(self, obj):
        if obj.member:
            return f"{obj.member.first_name} {obj.member.other_names}".strip()
        return "Unknown Member"

    def get_money_in(self, obj):
        if obj.transaction_type == SavingsPayment.TransactionType.MONEY_IN:
            return str(obj.amount)
        return "0.00"

    def get_money_out(self, obj):
        if obj.transaction_type == SavingsPayment.TransactionType.MONEY_OUT:
            return str(obj.amount)
        return "0.00"


class SavingsPaymentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating savings payments with automatic ledger journal posting.
    """
    class Meta:
        model = SavingsPayment
        fields = [
            "id",
            "member",
            "document_no",
            "savings_type",
            "transaction_type",
            "amount",
            "currency",
            "payment_mode",
            "bank_name",
            "transaction_no",
            "paid_on",
            "paid_by",
            "week",
            "month",
            "year",
            "remarks",
        ]
        extra_kwargs = {
            "document_no": {"required": False, "allow_blank": True},
            "bank_name": {"required": False, "allow_blank": True},
            "transaction_no": {"required": False, "allow_blank": True},
            "paid_by": {"required": False, "allow_blank": True},
            "remarks": {"required": False, "allow_blank": True},
            "week": {"required": False, "allow_null": True},
            "month": {"required": False, "allow_null": True},
            "year": {"required": False, "allow_null": True},
        }

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Savings amount must be greater than zero.")
        return value

    def create(self, validated_data):
        user = self.context.get("request").user if self.context.get("request") else None
        member = validated_data["member"]
        organization = getattr(member, "organization", None)

        if not organization and user and hasattr(user, "organization"):
            organization = user.organization

        instance = SavingsPayment.objects.create(
            organization=organization,
            recorded_by=user if user and user.is_authenticated else None,
            **validated_data
        )

        # Automatic balanced General Ledger posting
        try:
            cash_account, _ = LedgerAccount.objects.get_or_create(
                account_code="1010",
                defaults={
                    "account_name": "Cash and Bank Balances",
                    "account_type": "asset",
                    "is_active": True,
                    "organization": organization,
                },
            )

            account_code = "2020" if instance.savings_type == "welfare" else "2010"
            account_name = "Member Welfare Contributions" if instance.savings_type == "welfare" else "Member Normal Savings"

            savings_account, _ = LedgerAccount.objects.get_or_create(
                account_code=account_code,
                defaults={
                    "account_name": account_name,
                    "account_type": "liability",
                    "is_active": True,
                    "organization": organization,
                },
            )

            txn = LedgerTransaction.objects.create(
                transaction_number=f"SAV-{uuid4().hex[:8].upper()}",
                transaction_date=instance.paid_on,
                description=f"Savings payment: {instance.get_savings_type_display()} from {member.first_name} {member.other_names}",
                reference_type="SAVINGS",
                reference_id=instance.document_no or instance.transaction_no or str(instance.id),
            )

            if instance.transaction_type == SavingsPayment.TransactionType.MONEY_IN:
                # Debit Cash (Asset increases)
                LedgerEntry.objects.create(
                    transaction=txn,
                    account=cash_account,
                    entry_type=LedgerEntry.EntryType.DEBIT,
                    amount=instance.amount,
                    narration=f"Deposit via {instance.get_payment_mode_display()}",
                )
                # Credit Member Savings (Liability increases)
                LedgerEntry.objects.create(
                    transaction=txn,
                    account=savings_account,
                    entry_type=LedgerEntry.EntryType.CREDIT,
                    amount=instance.amount,
                    narration=f"Member savings contribution - Doc #{instance.document_no}",
                )
            else:
                # Money Out (Withdrawal / Refund)
                LedgerEntry.objects.create(
                    transaction=txn,
                    account=savings_account,
                    entry_type=LedgerEntry.EntryType.DEBIT,
                    amount=instance.amount,
                    narration=f"Savings withdrawal / payout - Doc #{instance.document_no}",
                )
                LedgerEntry.objects.create(
                    transaction=txn,
                    account=cash_account,
                    entry_type=LedgerEntry.EntryType.CREDIT,
                    amount=instance.amount,
                    narration=f"Payout via {instance.get_payment_mode_display()}",
                )
        except Exception as exc:
            # Don't fail savings creation if ledger accounts have custom constraint
            print(f"Ledger posting notice for savings #{instance.id}: {exc}")

        return instance


class SavingsWithdrawalSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.full_name", read_only=True)
    payroll_no = serializers.CharField(source="member.payroll_number", read_only=True, default="")
    membership_number = serializers.CharField(source="member.membership_number", read_only=True)
    withdrawal_type_display = serializers.CharField(source="get_withdrawal_type_display", read_only=True)
    savings_drawn_from_display = serializers.CharField(source="get_savings_drawn_from_display", read_only=True)
    bank_display = serializers.CharField(source="get_bank_display", read_only=True)

    class Meta:
        from apps.savings.models import SavingsWithdrawal
        model = SavingsWithdrawal
        fields = [
            "id",
            "organization",
            "member",
            "member_name",
            "payroll_no",
            "membership_number",
            "withdrawal_type",
            "withdrawal_type_display",
            "amount",
            "date_withdrawn",
            "savings_drawn_from",
            "savings_drawn_from_display",
            "bank",
            "bank_display",
            "document_code",
            "reason",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def validate(self, attrs):
        member = attrs.get("member")
        amount = attrs.get("amount")
        if amount and amount <= Decimal("0.00"):
            raise serializers.ValidationError({"amount": "Withdrawal amount must be greater than zero."})
        
        # Calculate active savings balance for member
        if member and amount:
            from django.db.models import Sum
            money_in = SavingsPayment.objects.filter(
                member=member,
                transaction_type=SavingsPayment.TransactionType.MONEY_IN,
                is_reversed=False,
            ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

            money_out = SavingsPayment.objects.filter(
                member=member,
                transaction_type=SavingsPayment.TransactionType.MONEY_OUT,
                is_reversed=False,
            ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

            available_savings = money_in - money_out
            if amount > available_savings:
                raise serializers.ValidationError({
                    "amount": f"Insufficient savings balance. Member has KES {available_savings:,.2f} available."
                })
        return attrs

