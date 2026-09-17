from decimal import Decimal
from uuid import uuid4
from rest_framework import serializers
from apps.shares.models import SharePayment
from apps.members.models import Member
from apps.loans.models import LedgerAccount, LedgerTransaction, LedgerEntry


class SharePaymentSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for viewing share payments in registers and tables.
    """
    member_name = serializers.SerializerMethodField()
    membership_number = serializers.CharField(source="member.membership_number", read_only=True)
    member_phone = serializers.CharField(source="member.phone_number", read_only=True)
    share_type_display = serializers.CharField(source="get_share_type_display", read_only=True)
    payment_mode_display = serializers.CharField(source="get_payment_mode_display", read_only=True)
    recorded_by_username = serializers.CharField(source="recorded_by.username", read_only=True)

    class Meta:
        model = SharePayment
        fields = [
            "id",
            "organization",
            "member",
            "member_name",
            "membership_number",
            "member_phone",
            "document_no",
            "share_type",
            "share_type_display",
            "number_of_shares",
            "share_price",
            "total_amount",
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
            "recorded_by",
            "recorded_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_member_name(self, obj):
        if obj.member:
            return f"{obj.member.first_name} {obj.member.other_names}".strip()
        return "Unknown Member"


class SharePaymentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating share payments with automatic ledger journal posting.
    """
    class Meta:
        model = SharePayment
        fields = [
            "id",
            "member",
            "document_no",
            "share_type",
            "number_of_shares",
            "share_price",
            "total_amount",
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
            "total_amount": {"required": False},
            "bank_name": {"required": False, "allow_blank": True},
            "transaction_no": {"required": False, "allow_blank": True},
            "paid_by": {"required": False, "allow_blank": True},
            "remarks": {"required": False, "allow_blank": True},
            "week": {"required": False, "allow_null": True},
            "month": {"required": False, "allow_null": True},
            "year": {"required": False, "allow_null": True},
        }

    def validate(self, attrs):
        num_shares = attrs.get("number_of_shares") or Decimal("1")
        price = attrs.get("share_price") or Decimal("100")
        if num_shares <= 0:
            raise serializers.ValidationError({"number_of_shares": "Number of shares must be greater than zero."})
        if price <= 0:
            raise serializers.ValidationError({"share_price": "Share price must be greater than zero."})
        attrs["total_amount"] = Decimal(str(num_shares)) * Decimal(str(price))
        return attrs

    def create(self, validated_data):
        user = self.context.get("request").user if self.context.get("request") else None
        member = validated_data["member"]
        organization = getattr(member, "organization", None)

        if not organization and user and hasattr(user, "organization"):
            organization = user.organization

        instance = SharePayment.objects.create(
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

            share_account, _ = LedgerAccount.objects.get_or_create(
                account_code="3010",
                defaults={
                    "account_name": "Member Share Capital",
                    "account_type": "equity",
                    "is_active": True,
                    "organization": organization,
                },
            )

            txn = LedgerTransaction.objects.create(
                transaction_number=f"SHR-{uuid4().hex[:8].upper()}",
                transaction_date=instance.paid_on,
                description=f"Share capital purchase: {instance.get_share_type_display()} ({instance.number_of_shares} shares @ KES {instance.share_price}) from {member.first_name} {member.other_names}",
                reference_type="SHARES",
                reference_id=instance.document_no or instance.transaction_no or str(instance.id),
            )

            # Debit Cash (Asset increases)
            LedgerEntry.objects.create(
                transaction=txn,
                account=cash_account,
                entry_type=LedgerEntry.EntryType.DEBIT,
                amount=instance.total_amount,
                narration=f"Share payment via {instance.get_payment_mode_display()} - Doc #{instance.document_no}",
            )

            # Credit Member Share Capital (Equity increases)
            LedgerEntry.objects.create(
                transaction=txn,
                account=share_account,
                entry_type=LedgerEntry.EntryType.CREDIT,
                amount=instance.total_amount,
                narration=f"Member share contribution - {instance.number_of_shares} shares - Doc #{instance.document_no}",
            )
        except Exception as exc:
            print(f"Ledger posting notice for share payment #{instance.id}: {exc}")

        return instance
