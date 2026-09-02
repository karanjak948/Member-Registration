from rest_framework import serializers
from decimal import Decimal
from apps.loans.models import Repayment, Loan, LoanStatus
from apps.loans.services.engine.repayment import allocate_repayment_waterfall
from apps.loans.services.accounting import record_repayment_journal
from apps.loans.services.engine.interest import round2
from django.db import transaction
from django.utils import timezone


class RepaymentSerializer(serializers.ModelSerializer):
    loan_number = serializers.CharField(source="loan.loan_number", read_only=True)
    member_name = serializers.SerializerMethodField()
    membership_number = serializers.CharField(
        source="loan.member.membership_number", read_only=True
    )

    class Meta:
        model = Repayment
        fields = [
            "id",
            "repayment_number",
            "loan",
            "loan_number",
            "member_name",
            "membership_number",
            "payment_date",
            "amount_paid",
            "payment_method",
            "transaction_reference",
            "allocated_principal",
            "allocated_interest",
            "allocated_fees",
            "allocated_penalty",
            "unallocated_amount",
            "notes",
            "recorded_by",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "repayment_number",
            "allocated_principal",
            "allocated_interest",
            "allocated_fees",
            "allocated_penalty",
            "unallocated_amount",
            "recorded_by",
            "created_at",
        ]

    def get_member_name(self, obj):
        return f"{obj.loan.member.first_name} {obj.loan.member.other_names}".strip()

    @transaction.atomic
    def create(self, validated_data):
        loan: Loan = validated_data["loan"]
        amount = round2(validated_data["amount_paid"])
        payment_date = validated_data.get("payment_date") or timezone.now().date()

        # Generate unique repayment number
        count = Repayment.objects.filter(loan=loan).count() + 1
        repayment_number = f"RPY-{loan.loan_number}-{count:03d}"

        # Run Waterfall Allocation
        order = loan.loan_product.allocation_order or "penalty,fees,interest,principal"
        alloc = allocate_repayment_waterfall(
            payment_amount=amount,
            outstanding_penalty=loan.penalty_balance,
            outstanding_fees=loan.fees_balance,
            outstanding_interest=loan.interest_balance,
            outstanding_principal=loan.principal_balance,
            allocation_order=order,
        )

        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None

        repayment = Repayment.objects.create(
            repayment_number=repayment_number,
            loan=loan,
            payment_date=payment_date,
            amount_paid=amount,
            payment_method=validated_data.get("payment_method", "mpesa"),
            transaction_reference=validated_data["transaction_reference"],
            allocated_principal=alloc.allocated_principal,
            allocated_interest=alloc.allocated_interest,
            allocated_fees=alloc.allocated_fees,
            allocated_penalty=alloc.allocated_penalty,
            unallocated_amount=alloc.remaining_unallocated,
            notes=validated_data.get("notes", ""),
            recorded_by=user,
        )

        # Update loan schedule installments
        rem_prn_alloc = alloc.allocated_principal
        rem_int_alloc = alloc.allocated_interest
        rem_fee_alloc = alloc.allocated_fees
        rem_pen_alloc = alloc.allocated_penalty

        unpaid_entries = loan.schedule_entries.filter(is_paid=False).order_by("period_number")
        for entry in unpaid_entries:
            if rem_pen_alloc > Decimal("0"):
                due_pen = max(Decimal("0"), entry.expected_penalty - entry.paid_penalty)
                pay = min(rem_pen_alloc, due_pen)
                entry.paid_penalty += pay
                rem_pen_alloc -= pay

            if rem_fee_alloc > Decimal("0"):
                due_fee = max(Decimal("0"), entry.expected_fees - entry.paid_fees)
                pay = min(rem_fee_alloc, due_fee)
                entry.paid_fees += pay
                rem_fee_alloc -= pay

            if rem_int_alloc > Decimal("0"):
                due_int = max(Decimal("0"), entry.expected_interest - entry.paid_interest)
                pay = min(rem_int_alloc, due_int)
                entry.paid_interest += pay
                rem_int_alloc -= pay

            if rem_prn_alloc > Decimal("0"):
                due_prn = max(Decimal("0"), entry.expected_principal - entry.paid_principal)
                pay = min(rem_prn_alloc, due_prn)
                entry.paid_principal += pay
                rem_prn_alloc -= pay

            if entry.total_due <= Decimal("0.01"):
                entry.is_paid = True
                entry.paid_date = payment_date

            entry.save()

        # Update Loan Header Balances
        loan.penalty_balance = max(Decimal("0"), loan.penalty_balance - alloc.allocated_penalty)
        loan.fees_balance = max(Decimal("0"), loan.fees_balance - alloc.allocated_fees)
        loan.interest_balance = max(Decimal("0"), loan.interest_balance - alloc.allocated_interest)
        loan.principal_balance = max(Decimal("0"), loan.principal_balance - alloc.allocated_principal)
        loan.outstanding_balance = (
            loan.principal_balance
            + loan.interest_balance
            + loan.fees_balance
            + loan.penalty_balance
        )

        loan.total_principal_paid += alloc.allocated_principal
        loan.total_interest_paid += alloc.allocated_interest
        loan.total_fees_paid += alloc.allocated_fees
        loan.total_penalties_paid += alloc.allocated_penalty
        loan.last_payment_date = payment_date

        if loan.outstanding_balance <= Decimal("0.01"):
            loan.status = LoanStatus.CLOSED
            loan.outstanding_balance = Decimal("0.00")
            loan.principal_balance = Decimal("0.00")
            loan.interest_balance = Decimal("0.00")

        loan.save()

        # Post Double-Entry Journal Entry
        record_repayment_journal(repayment)

        return repayment
