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

        # If reducing balance, dynamically recalculate future unaccrued interest when principal was paid down
        if loan.interest_method == "reducing_balance" and alloc.allocated_principal > Decimal("0.00"):
            if loan.principal_balance > Decimal("0.00"):
                product = loan.loan_product
                r_pct = Decimal(str(loan.interest_rate))
                if getattr(product, "interest_period", "monthly") == "yearly":
                    annual_rate = r_pct / Decimal("100")
                else:
                    annual_rate = (r_pct / Decimal("100")) * Decimal("12")

                from apps.loans.services.engine.interest import PERIODS_PER_YEAR
                freq_py = Decimal(str(PERIODS_PER_YEAR.get(loan.repayment_frequency, 12)))
                r_per = annual_rate / freq_py

                total_sched_count = loan.schedule_entries.count()
                active_unpaid = loan.schedule_entries.filter(is_paid=False).order_by("period_number")
                num_rem = active_unpaid.count()
                if num_rem > 0 and total_sched_count >= loan.num_periods:
                    cur_bal = loan.principal_balance
                    prn_each = round2(cur_bal / Decimal(str(num_rem)))
                    for idx, rem_entry in enumerate(active_unpaid, 1):
                        rem_entry.opening_balance = round2(cur_bal)
                        rem_entry.expected_interest = round2(cur_bal * r_per)
                        if idx == num_rem:
                            rem_entry.expected_principal = cur_bal
                            rem_entry.closing_balance = Decimal("0.00")
                        else:
                            rem_entry.expected_principal = min(cur_bal, prn_each)
                            rem_entry.closing_balance = max(Decimal("0.00"), round2(cur_bal - rem_entry.expected_principal))
                        rem_entry.expected_amount = round2(rem_entry.expected_principal + rem_entry.expected_interest)
                        cur_bal = rem_entry.closing_balance
                        rem_entry.save()

                    rem_interest = sum(
                        max(Decimal("0.00"), e.expected_interest - e.paid_interest)
                        for e in loan.schedule_entries.filter(is_paid=False)
                    )
                    loan.interest_balance = round2(rem_interest)
            else:
                # Principal fully cleared: close unaccrued schedule entries
                for rem_entry in loan.schedule_entries.filter(is_paid=False):
                    rem_entry.expected_interest = rem_entry.paid_interest
                    rem_entry.expected_principal = rem_entry.paid_principal
                    rem_entry.expected_amount = rem_entry.paid_principal + rem_entry.paid_interest
                    rem_entry.is_paid = True
                    rem_entry.paid_date = payment_date
                    rem_entry.save()
                loan.interest_balance = Decimal("0.00")

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

        is_closed = False
        if loan.outstanding_balance <= Decimal("0.01"):
            loan.status = LoanStatus.CLOSED
            loan.outstanding_balance = Decimal("0.00")
            loan.principal_balance = Decimal("0.00")
            loan.interest_balance = Decimal("0.00")
            is_closed = True

        loan.save()

        # Post Double-Entry Journal Entry
        record_repayment_journal(repayment)

        # Trigger Repayment Confirmation SMS & Loan Completion SMS
        try:
            from apps.common.notification_service import NotificationService
            NotificationService.notify_repayment(repayment, remaining_balance=loan.outstanding_balance)
            if is_closed:
                NotificationService.notify_loan_completion(loan)
        except Exception as notif_err:
            import logging
            logging.getLogger(__name__).error(f"Failed to dispatch repayment SMS for {repayment.repayment_number}: {notif_err}")

        return repayment
