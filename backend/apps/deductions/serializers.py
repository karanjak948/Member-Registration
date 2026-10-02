from decimal import Decimal
from rest_framework import serializers
from apps.deductions.models import MonthlyDeduction, MonthlyDeductionBatch
from apps.members.models import Member


class MonthlyDeductionSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.full_name", read_only=True)
    membership_number = serializers.CharField(source="member.membership_number", read_only=True)
    national_id = serializers.CharField(source="member.national_id", read_only=True)
    phone_number = serializers.CharField(source="member.phone_number", read_only=True)
    category_name = serializers.CharField(source="member.category.name", read_only=True, default="")

    class Meta:
        model = MonthlyDeduction
        fields = [
            "id",
            "organization",
            "member",
            "member_name",
            "membership_number",
            "national_id",
            "phone_number",
            "category_name",
            "month",
            "year",
            "charges",
            "loan_principal",
            "loan_interest",
            "registration_fee",
            "savings",
            "shares",
            "others",
            "total_expected",
            "amount_paid",
            "balance",
            "status",
            "paid_thro",
            "date_paid",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "total_expected",
            "balance",
            "status",
            "created_at",
            "updated_at",
        ]


class MonthlyDeductionCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyDeduction
        fields = [
            "id",
            "member",
            "month",
            "year",
            "charges",
            "loan_principal",
            "loan_interest",
            "registration_fee",
            "savings",
            "shares",
            "others",
            "amount_paid",
            "paid_thro",
            "date_paid",
            "notes",
        ]

    def validate(self, attrs):
        # Ensure numerical non-negative amounts
        for field in [
            "charges",
            "loan_principal",
            "loan_interest",
            "registration_fee",
            "savings",
            "shares",
            "others",
            "amount_paid",
        ]:
            if field in attrs and attrs[field] is not None:
                if attrs[field] < Decimal("0.00"):
                    raise serializers.ValidationError({field: "Amount cannot be negative."})
        return attrs


class MonthlyDeductionBatchSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.get_full_name", read_only=True, default=""
    )

    class Meta:
        model = MonthlyDeductionBatch
        fields = [
            "id",
            "batch_no",
            "month",
            "year",
            "paid_thro",
            "date_paid",
            "total_amount",
            "row_count",
            "success_count",
            "error_count",
            "uploaded_file",
            "remarks",
            "uploaded_by_name",
            "created_at",
        ]
        read_only_fields = fields


class MonthlyDeductionItemLogSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.full_name", read_only=True, default="")
    membership_number = serializers.CharField(source="member.membership_number", read_only=True, default="")
    batch_no = serializers.CharField(source="batch.batch_no", read_only=True)

    class Meta:
        from apps.deductions.models import MonthlyDeductionItemLog
        model = MonthlyDeductionItemLog
        fields = [
            "id",
            "batch",
            "batch_no",
            "deduction",
            "member",
            "member_name",
            "membership_number",
            "row_number",
            "raw_employee_no",
            "raw_employee_name",
            "raw_total_ded",
            "amount_charges",
            "amount_loan_interest",
            "amount_loan_principal",
            "amount_savings",
            "amount_shares",
            "amount_others",
            "amount_surplus",
            "status",
            "error_message",
            "created_at",
        ]
        read_only_fields = fields

