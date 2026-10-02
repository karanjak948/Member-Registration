from rest_framework import serializers
from apps.common.models import PaymentReversalLog


class PaymentReversalLogSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.full_name", read_only=True, default="")
    membership_number = serializers.CharField(source="member.membership_number", read_only=True, default="")
    payment_type_display = serializers.CharField(source="get_payment_type_display", read_only=True)
    reversed_by_username = serializers.CharField(source="reversed_by.username", read_only=True, default="")

    class Meta:
        model = PaymentReversalLog
        fields = [
            "id",
            "organization",
            "payment_type",
            "payment_type_display",
            "original_payment_id",
            "document_or_receipt_no",
            "member",
            "member_name",
            "membership_number",
            "amount_reversed",
            "reversal_reason",
            "reversed_by",
            "reversed_by_username",
            "reversed_at",
            "snapshot_data",
            "created_at",
        ]
        read_only_fields = fields
