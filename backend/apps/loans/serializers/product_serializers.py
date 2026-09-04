from rest_framework import serializers
from django.db import transaction
from apps.loans.models import LoanProduct, LoanProductFee, LoanProductPenalty


class LoanProductFeeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = LoanProductFee
        fields = [
            "id",
            "fee_name",
            "fee_type",
            "fee_value",
            "fee_basis",
            "affects_principal",
            "show_in_statement",
            "ledger_account_name",
        ]


class LoanProductPenaltySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = LoanProductPenalty
        fields = [
            "id",
            "penalty_name",
            "penalty_type",
            "penalty_value",
            "grace_period_days",
            "ledger_account_name",
        ]


class LoanProductSerializer(serializers.ModelSerializer):
    fees = LoanProductFeeSerializer(many=True, required=False)
    penalties = LoanProductPenaltySerializer(many=True, required=False)
    active_loans_count = serializers.SerializerMethodField()

    class Meta:
        model = LoanProduct
        fields = [
            "id",
            "product_code",
            "version_number",
            "product_name",
            "is_active",
            "effective_date",
            "interest_method",
            "interest_rate",
            "interest_period",
            "repayment_frequency",
            "min_repayment_period",
            "max_repayment_period",
            "min_amount",
            "max_amount",
            "requires_guarantor",
            "min_guarantors",
            "is_multiple_of_savings",
            "savings_multiplier",
            "requires_security",
            "security_type",
            "security_value",
            "security_notes",
            "requires_deposit",
            "deposit_type",
            "deposit_value",
            "allocation_order",
            "late_payment_penalty_type",
            "late_payment_penalty_value",
            "grace_period_days",
            "requires_appraisal",
            "requires_board_approval",
            "watchful_after_days",
            "non_performing_after_days",
            "doubtful_after_days",
            "allows_rescheduling",
            "reschedule_fee_type",
            "reschedule_fee_value",
            "allows_offset",
            "offset_covers",
            "offset_fee_type",
            "offset_fee_value",
            "organization",
            "fees",
            "penalties",
            "active_loans_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "version_number", "created_at", "updated_at"]
        validators = []  # Disables default unique_together validator as versioning is handled in create/update

    def get_active_loans_count(self, obj):
        return obj.loans.filter(status__in=["active", "watchful", "non_performing", "doubtful"]).count()

    @transaction.atomic
    def create(self, validated_data):
        fees_data = validated_data.pop("fees", [])
        penalties_data = validated_data.pop("penalties", [])

        # Auto-compute version number for this product_code
        product_code = validated_data.get("product_code")
        latest = LoanProduct.objects.filter(product_code=product_code).order_by("-version_number").first()
        if latest:
            version_number = latest.version_number + 1
            # Deactivate previous versions
            LoanProduct.objects.filter(product_code=product_code).update(is_active=False)
        else:
            version_number = 1

        product = LoanProduct.objects.create(
            version_number=version_number,
            is_active=True,
            **validated_data
        )

        for fee in fees_data:
            fee.pop("id", None)
            LoanProductFee.objects.create(product=product, **fee)

        for penalty in penalties_data:
            penalty.pop("id", None)
            LoanProductPenalty.objects.create(product=product, **penalty)

        return product

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Updating a product creates a new version if financial terms change.
        """
        # Extract nested relations and explicit fields
        fees_data = validated_data.pop("fees", None)
        penalties_data = validated_data.pop("penalties", None)
        product_code = validated_data.pop("product_code", instance.product_code)
        validated_data.pop("version_number", None)
        validated_data.pop("is_active", None)

        # Spawn new version based on latest existing version for this product_code
        latest = LoanProduct.objects.filter(product_code=product_code).order_by("-version_number").first()
        new_version = (latest.version_number + 1) if latest else (instance.version_number + 1)
        instance.is_active = False
        instance.save(update_fields=["is_active"])

        # Also ensure all previous versions with this code are inactive
        LoanProduct.objects.filter(product_code=product_code).update(is_active=False)

        # Create new version record
        new_product = LoanProduct.objects.create(
            product_code=product_code,
            version_number=new_version,
            is_active=True,
            **validated_data
        )

        # Clone or update fees
        if fees_data is not None:
            for fee in fees_data:
                fee.pop("id", None)
                LoanProductFee.objects.create(product=new_product, **fee)
        else:
            for fee in instance.fees.all():
                LoanProductFee.objects.create(
                    product=new_product,
                    fee_name=fee.fee_name,
                    fee_type=fee.fee_type,
                    fee_value=fee.fee_value,
                    fee_basis=fee.fee_basis,
                    affects_principal=fee.affects_principal,
                    show_in_statement=fee.show_in_statement,
                    ledger_account_name=fee.ledger_account_name,
                )

        # Clone or update penalties
        if penalties_data is not None:
            for penalty in penalties_data:
                penalty.pop("id", None)
                LoanProductPenalty.objects.create(product=new_product, **penalty)
        else:
            for penalty in instance.penalties.all():
                LoanProductPenalty.objects.create(
                    product=new_product,
                    penalty_name=penalty.penalty_name,
                    penalty_type=penalty.penalty_type,
                    penalty_value=penalty.penalty_value,
                    grace_period_days=penalty.grace_period_days,
                    ledger_account_name=penalty.ledger_account_name,
                )

        return new_product
