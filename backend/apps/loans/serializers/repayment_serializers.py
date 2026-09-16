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
    is_early_settlement = serializers.BooleanField(required=False, default=False, write_only=True)

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
            "is_early_settlement",
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
        is_early_settlement = validated_data.pop("is_early_settlement", False)
        loan: Loan = validated_data["loan"]
        amount = round2(validated_data["amount_paid"])
        payment_date = validated_data.get("payment_date") or timezone.now().date()

        # Generate unique repayment number
        count = Repayment.objects.filter(loan=loan).count() + 1
        repayment_number = f"RPY-{loan.loan_number}-{count:03d}"

        # Determine due interest:
        # In financial accounting (especially reducing balance), interest accrues over time.
        # Unpaid schedule entries beyond active or matured installments have NOT accrued interest yet.
        # When a borrower clears the loan early (early payoff), future unaccrued interest is waived.
        unpaid_entries = list(loan.schedule_entries.filter(is_paid=False).order_by("period_number"))

        due_penalty = loan.penalty_balance
        due_fees = loan.fees_balance

        # Overdue entries whose due_date <= payment_date
        overdue_entries = [e for e in unpaid_entries if e.due_date <= payment_date]
        overdue_interest = sum(
            max(Decimal("0.00"), e.expected_interest - e.paid_interest)
            for e in overdue_entries
        )

        # Determine due interest:
        # 1. Explicit early settlement: only accrued/current-cycle interest is collected; unaccrued future interest is waived.
        # 2. Reducing Balance Microfinance Model (Peter Irungu's specification):
        #    - Interest accrues cycle-by-cycle (every 30 days).
        #    - Within an active 30-day cycle, interest is charged only once (Cycle Interest = 20% of opening balance).
        #    - First payment in cycle satisfies the cycle's unpaid interest; any excess goes 100% to principal reduction.
        #    - Subsequent payments in the same cycle incur ZERO interest; 100% reduces principal balance.
        #    - Clearing the loan in Month 1 charges only Month 1 interest (e.g. 6k on 30k = 36k total).
        #    - In subsequent months, interest is 20% on the remaining principal balance.
        is_reducing = loan.interest_method == "reducing_balance"
        total_full_payoff = loan.principal_balance + loan.interest_balance + due_penalty + due_fees

        if is_early_settlement:
            if is_reducing and unpaid_entries:
                all_entries = list(loan.schedule_entries.all().order_by("period_number"))
                curr_active = None
                for entry in all_entries:
                    if payment_date <= entry.due_date:
                        curr_active = entry
                        break
                active_unpaid = (
                    max(Decimal("0.00"), curr_active.expected_interest - curr_active.paid_interest)
                    if curr_active and not curr_active.is_paid
                    else Decimal("0.00")
                )
                overdue_int = sum(
                    max(Decimal("0.00"), e.expected_interest - e.paid_interest)
                    for e in unpaid_entries if e.due_date < payment_date
                )
                due_interest = overdue_int + active_unpaid
            else:
                due_interest = overdue_interest
        elif is_reducing and unpaid_entries:
            # Under Peter Irungu's specification:
            # Interest is charged on 30-day boundaries (Cycle 1 at disbursement, Cycle 2 on day 30, etc.)
            disb = loan.disbursement_date or (loan.schedule_entries.first().due_date - timedelta(days=30))
            all_entries = list(loan.schedule_entries.all().order_by("period_number"))

            current_active_entry = None
            for entry in all_entries:
                if payment_date <= entry.due_date:
                    current_active_entry = entry
                    break
            if current_active_entry is None:
                current_active_entry = all_entries[-1]

            # Overdue interest from previous completed cycles
            overdue_int = sum(
                max(Decimal("0.00"), e.expected_interest - e.paid_interest)
                for e in unpaid_entries if e.due_date < payment_date
            )

            # Unpaid interest for the cycle active on payment_date
            if current_active_entry and not current_active_entry.is_paid:
                active_cycle_unpaid_interest = max(
                    Decimal("0.00"), current_active_entry.expected_interest - current_active_entry.paid_interest
                )
            else:
                active_cycle_unpaid_interest = Decimal("0.00")

            current_cycle_due = overdue_int + active_cycle_unpaid_interest

            # Check early payoff threshold
            payoff_threshold = loan.principal_balance + current_cycle_due + due_penalty + due_fees
            if amount >= payoff_threshold:
                due_interest = current_cycle_due
            else:
                due_interest = current_cycle_due
        elif amount >= total_full_payoff:
            due_interest = loan.interest_balance
        elif not unpaid_entries:
            due_interest = loan.interest_balance
        else:
            # Calculate interest across the unpaid installments that this payment amount covers
            rem_for_installments = max(Decimal("0.00"), amount - due_penalty - due_fees)
            accumulated_interest = Decimal("0.00")
            for entry in unpaid_entries:
                if rem_for_installments <= Decimal("0.00"):
                    break
                rem_entry_int = max(Decimal("0.00"), entry.expected_interest - entry.paid_interest)
                rem_entry_prn = max(Decimal("0.00"), entry.expected_principal - entry.paid_principal)
                rem_entry_fee = max(Decimal("0.00"), entry.expected_fees - entry.paid_fees)
                rem_entry_pen = max(Decimal("0.00"), entry.expected_penalty - entry.paid_penalty)
                installment_total = rem_entry_pen + rem_entry_fee + rem_entry_int + rem_entry_prn

                if rem_for_installments >= installment_total:
                    accumulated_interest += rem_entry_int
                    rem_for_installments -= installment_total
                else:
                    # Partial installment: interest is prioritized
                    accumulated_interest += min(rem_for_installments, rem_entry_int)
                    rem_for_installments = Decimal("0.00")
                    break

            if rem_for_installments > Decimal("0.00"):
                accumulated_interest = min(loan.interest_balance, accumulated_interest + rem_for_installments)

            due_interest = min(loan.interest_balance, accumulated_interest)

        # Run Waterfall Allocation
        order = loan.loan_product.allocation_order or "penalty,fees,interest,principal"
        alloc = allocate_repayment_waterfall(
            payment_amount=amount,
            outstanding_penalty=due_penalty,
            outstanding_fees=due_fees,
            outstanding_interest=due_interest,
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

        is_reducing = loan.interest_method == "reducing_balance"
        active_entry = unpaid_entries[0] if unpaid_entries else None

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

            if entry.remaining_principal <= Decimal("0.01") and entry.remaining_interest <= Decimal("0.01"):
                entry.is_paid = True
                entry.paid_date = payment_date

            if entry.paid_principal > Decimal("0.00"):
                entry.closing_balance = max(Decimal("0.00"), entry.opening_balance - entry.paid_principal)

            entry.save()

        # If any extra principal prepayment remains beyond all scheduled installments, apply to last unpaid entry
        if rem_prn_alloc > Decimal("0"):
            last_entry = unpaid_entries[-1] if unpaid_entries else None
            if last_entry:
                last_entry.paid_principal += rem_prn_alloc
                last_entry.closing_balance = max(Decimal("0.00"), last_entry.opening_balance - last_entry.paid_principal)
                if last_entry.remaining_principal <= Decimal("0.01") and last_entry.remaining_interest <= Decimal("0.01"):
                    last_entry.is_paid = True
                    last_entry.paid_date = payment_date
                last_entry.save()

        # Update Loan Header Balances
        loan.penalty_balance = max(Decimal("0"), loan.penalty_balance - alloc.allocated_penalty)
        loan.fees_balance = max(Decimal("0"), loan.fees_balance - alloc.allocated_fees)
        loan.interest_balance = max(Decimal("0"), loan.interest_balance - alloc.allocated_interest)
        loan.principal_balance = max(Decimal("0"), loan.principal_balance - alloc.allocated_principal)

        # Check if early settlement concession or if loan obligations are cleared
        if is_early_settlement:
            loan.principal_balance = Decimal("0.00")
            loan.interest_balance = Decimal("0.00")
            # Close all remaining schedule entries (waiving unearned future interest on explicit early settlement)
            for rem_entry in loan.schedule_entries.filter(is_paid=False):
                rem_entry.expected_interest = rem_entry.paid_interest
                rem_entry.expected_principal = rem_entry.paid_principal
                rem_entry.expected_amount = rem_entry.paid_principal + rem_entry.paid_interest
                rem_entry.closing_balance = Decimal("0.00")
                rem_entry.is_paid = True
                rem_entry.paid_date = payment_date
                rem_entry.save()
        elif loan.principal_balance <= Decimal("0.01"):
            loan.principal_balance = Decimal("0.00")
            loan.interest_balance = Decimal("0.00")
            for rem_entry in loan.schedule_entries.filter(is_paid=False):
                rem_entry.expected_interest = rem_entry.paid_interest
                rem_entry.expected_principal = rem_entry.paid_principal
                rem_entry.expected_amount = rem_entry.paid_principal + rem_entry.paid_interest
                rem_entry.closing_balance = Decimal("0.00")
                rem_entry.is_paid = True
                rem_entry.paid_date = payment_date
                rem_entry.save()

        # For reducing balance loans where principal was paid down and multiple schedule entries exist,
        # dynamically recalculate future cycles' interest strictly against the reduced principal balance (Peter Irungu's specification)
        has_future_entries = loan.schedule_entries.filter(period_number__gt=1).exists()
        if is_reducing and not is_early_settlement and alloc.allocated_principal > Decimal("0.00") and has_future_entries and loan.principal_balance > Decimal("0.01"):
            rate_pct = loan.interest_rate / Decimal("100")
            if loan.loan_product and loan.loan_product.interest_period == "yearly":
                r_per = rate_pct / Decimal("12")
            else:
                r_per = rate_pct

            remaining_unpaid_entries = list(loan.schedule_entries.filter(is_paid=False).order_by("period_number"))
            num_rem = len(remaining_unpaid_entries)
            if num_rem > 1:
                rem_prn_per_period = round2(loan.principal_balance / Decimal(str(num_rem)))
                sim_bal = loan.principal_balance
                new_future_interest_total = Decimal("0.00")

                for idx, r_entry in enumerate(remaining_unpaid_entries):
                    r_entry.opening_balance = round2(sim_bal)
                    int_charge = round2(sim_bal * r_per)
                    r_entry.expected_interest = int_charge

                    if idx == num_rem - 1:
                        prn_comp = sim_bal
                        r_entry.closing_balance = Decimal("0.00")
                    else:
                        prn_comp = rem_prn_per_period
                        r_entry.closing_balance = round2(sim_bal - prn_comp)

                    r_entry.expected_principal = prn_comp
                    r_entry.expected_amount = round2(
                        prn_comp + int_charge + r_entry.expected_fees + r_entry.expected_penalty
                    )
                    r_entry.save(update_fields=[
                        "opening_balance",
                        "expected_interest",
                        "expected_principal",
                        "closing_balance",
                        "expected_amount",
                    ])
                    sim_bal = r_entry.closing_balance
                    rem_int_entry = max(Decimal("0.00"), int_charge - r_entry.paid_interest)
                    new_future_interest_total += rem_int_entry

                loan.interest_balance = round2(new_future_interest_total)

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
