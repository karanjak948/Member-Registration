from rest_framework import serializers
from decimal import Decimal
from apps.loans.models import (
    Loan,
    LoanProduct,
    LoanScheduleEntry,
    LoanGuarantor,
    LoanCollateral,
    LoanStatus,
)
from apps.members.models import Member
from apps.loans.services.engine.schedule import generate_schedule
from apps.loans.services.engine.fees import calculate_fee
from apps.loans.services.engine.interest import round2


class LoanScheduleEntrySerializer(serializers.ModelSerializer):
    total_paid = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    remaining_principal = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    remaining_interest = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    remaining_fees = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    remaining_penalty = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_due = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = LoanScheduleEntry
        fields = [
            "id",
            "period_number",
            "due_date",
            "expected_amount",
            "expected_principal",
            "expected_interest",
            "expected_fees",
            "expected_penalty",
            "paid_principal",
            "paid_interest",
            "paid_fees",
            "paid_penalty",
            "opening_balance",
            "closing_balance",
            "is_paid",
            "paid_date",
            "total_paid",
            "remaining_principal",
            "remaining_interest",
            "remaining_fees",
            "remaining_penalty",
            "total_due",
        ]


class LoanGuarantorSerializer(serializers.ModelSerializer):
    guarantor_id = serializers.IntegerField(source="guarantor_member.id", read_only=True)
    guarantor_name = serializers.SerializerMethodField()
    guarantor_membership_no = serializers.CharField(
        source="guarantor_member.membership_number", read_only=True
    )
    guarantor_phone = serializers.CharField(source="guarantor_member.phone_number", read_only=True)
    guarantor_national_id = serializers.CharField(source="guarantor_member.national_id", read_only=True)

    class Meta:
        model = LoanGuarantor
        fields = [
            "id",
            "guarantor_member",
            "guarantor_id",
            "guarantor_name",
            "guarantor_membership_no",
            "guarantor_phone",
            "guarantor_national_id",
            "guarantee_amount",
            "status",
            "notes",
        ]

    def get_guarantor_name(self, obj):
        if obj.guarantor_member:
            return f"{obj.guarantor_member.first_name} {obj.guarantor_member.other_names}".strip()
        return "N/A"


class LoanCollateralSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanCollateral
        fields = [
            "id",
            "asset_type",
            "asset_name",
            "serial_or_reg_number",
            "estimated_value",
            "document",
            "is_verified",
            "notes",
        ]


class LoanListSerializer(serializers.ModelSerializer):
    member_id = serializers.IntegerField(source="member.id", read_only=True)
    loan_product_id = serializers.IntegerField(source="loan_product.id", read_only=True)
    member_name = serializers.SerializerMethodField()
    membership_number = serializers.CharField(source="member.membership_number", read_only=True)
    member_phone = serializers.CharField(source="member.phone_number", read_only=True)
    product_name = serializers.CharField(source="loan_product.product_name", read_only=True)
    product_code = serializers.CharField(source="loan_product.product_code", read_only=True)

    class Meta:
        model = Loan
        fields = [
            "id",
            "loan_number",
            "member",
            "member_id",
            "member_name",
            "membership_number",
            "member_phone",
            "loan_product",
            "loan_product_id",
            "product_name",
            "product_code",
            "principal_amount",
            "num_periods",
            "interest_rate",
            "interest_method",
            "repayment_frequency",
            "status",
            "outstanding_balance",
            "principal_balance",
            "interest_balance",
            "penalty_balance",
            "fees_balance",
            "application_date",
            "disbursement_date",
            "maturity_date",
            "days_overdue",
            "last_payment_date",
            "created_at",
        ]

    def get_member_name(self, obj):
        return f"{obj.member.first_name} {obj.member.other_names}".strip()


class LoanDetailSerializer(serializers.ModelSerializer):
    member_id = serializers.IntegerField(source="member.id", read_only=True)
    loan_product_id = serializers.IntegerField(source="loan_product.id", read_only=True)
    guarantor_member_id = serializers.SerializerMethodField()
    member_name = serializers.SerializerMethodField()
    membership_number = serializers.CharField(source="member.membership_number", read_only=True)
    member_phone = serializers.CharField(source="member.phone_number", read_only=True)
    member_national_id = serializers.CharField(source="member.national_id", read_only=True)
    product_name = serializers.CharField(source="loan_product.product_name", read_only=True)
    product_code = serializers.CharField(source="loan_product.product_code", read_only=True)
    schedule_entries = LoanScheduleEntrySerializer(many=True, read_only=True)
    guarantors = LoanGuarantorSerializer(many=True, read_only=True)
    collaterals = LoanCollateralSerializer(many=True, read_only=True)

    class Meta:
        model = Loan
        fields = [
            "id",
            "loan_number",
            "member",
            "member_id",
            "member_name",
            "membership_number",
            "member_phone",
            "member_national_id",
            "loan_product",
            "loan_product_id",
            "product_name",
            "product_code",
            "guarantor_member_id",
            "principal_amount",
            "security_provided_value",
            "security_provided_notes",
            "deposit_paid_amount",
            "application_date",
            "disbursement_date",
            "maturity_date",
            "num_periods",
            "interest_rate",
            "interest_method",
            "repayment_frequency",
            "status",
            "outstanding_balance",
            "principal_balance",
            "interest_balance",
            "penalty_balance",
            "fees_balance",
            "total_principal_paid",
            "total_interest_paid",
            "total_fees_paid",
            "total_penalties_paid",
            "days_overdue",
            "last_payment_date",
            "appraisal_notes",
            "approval_notes",
            "rejection_reason",
            "schedule_entries",
            "guarantors",
            "collaterals",
            "created_at",
            "updated_at",
        ]

    def get_member_name(self, obj):
        return f"{obj.member.first_name} {obj.member.other_names}".strip()

    def get_guarantor_member_id(self, obj):
        first_g = obj.guarantors.first()
        if first_g and first_g.guarantor_member_id:
            return first_g.guarantor_member_id
        return None


class LoanApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for submitting a new loan application.
    Supports both primary key objects (member, loan_product) and ID aliases (member_id, loan_product_id).
    """
    member = serializers.PrimaryKeyRelatedField(queryset=Member.objects.all(), required=False)
    loan_product = serializers.PrimaryKeyRelatedField(queryset=LoanProduct.objects.all(), required=False)
    member_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), source="member", required=False, write_only=True
    )
    loan_product_id = serializers.PrimaryKeyRelatedField(
        queryset=LoanProduct.objects.all(), source="loan_product", required=False, write_only=True
    )
    guarantors_data = LoanGuarantorSerializer(many=True, required=False)
    collaterals_data = LoanCollateralSerializer(many=True, required=False)

    class Meta:
        model = Loan
        fields = [
            "id",
            "member",
            "member_id",
            "loan_product",
            "loan_product_id",
            "principal_amount",
            "num_periods",
            "application_date",
            "security_provided_value",
            "security_provided_notes",
            "deposit_paid_amount",
            "guarantors_data",
            "collaterals_data",
        ]
        read_only_fields = ["id"]

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, "copy") else dict(data)
        if "member_id" in mutable_data and "member" not in mutable_data:
            mutable_data["member"] = mutable_data["member_id"]
        if "loan_product_id" in mutable_data and "loan_product" not in mutable_data:
            mutable_data["loan_product"] = mutable_data["loan_product_id"]
        return super().to_internal_value(mutable_data)

    def validate(self, attrs):
        if not attrs.get("member"):
            raise serializers.ValidationError({"member": "Borrower member is required."})
        if not attrs.get("loan_product"):
            raise serializers.ValidationError({"loan_product": "Loan product is required."})

        product = attrs.get("loan_product")
        principal = attrs.get("principal_amount")
        periods = attrs.get("num_periods")

        if product:
            if product.min_amount and principal < product.min_amount:
                raise serializers.ValidationError(
                    {"principal_amount": f"Minimum loan amount is {product.min_amount}."}
                )
            if product.max_amount and principal > product.max_amount:
                raise serializers.ValidationError(
                    {"principal_amount": f"Maximum loan amount is {product.max_amount}."}
                )
            if product.max_repayment_period and periods and periods > product.max_repayment_period:
                raise serializers.ValidationError(
                    {"num_periods": f"Maximum repayment period is {product.max_repayment_period}."}
                )

        return attrs


class LoanCalculatorPreviewSerializer(serializers.Serializer):
    """
    Loan Calculator Request / Response Serializer.
    """
    principal = serializers.DecimalField(max_digits=15, decimal_places=2)
    loan_product_id = serializers.IntegerField(required=False)
    interest_rate = serializers.DecimalField(max_digits=8, decimal_places=4, required=False)
    interest_method = serializers.ChoiceField(
        choices=["flat", "reducing_balance", "compound"], default="reducing_balance"
    )
    interest_period = serializers.ChoiceField(
        choices=["monthly", "yearly"], default="monthly"
    )
    repayment_frequency = serializers.ChoiceField(
        choices=["daily", "weekly", "monthly", "yearly"], default="monthly"
    )
    num_periods = serializers.IntegerField(min_value=1)
    start_date = serializers.DateField(required=False)
