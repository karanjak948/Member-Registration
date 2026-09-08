import logging
from datetime import date
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

logger = logging.getLogger(__name__)

from apps.loans.models import (
    Loan,
    LoanProduct,
    LoanStatus,
    LoanScheduleEntry,
    LoanGuarantor,
    LoanCollateral,
    LoanReschedule,
)
from apps.loans.serializers import (
    LoanListSerializer,
    LoanDetailSerializer,
    LoanApplicationSerializer,
    LoanCalculatorPreviewSerializer,
    LoanScheduleEntrySerializer,
)
from apps.loans.services.engine.schedule import generate_schedule, add_periods
from apps.loans.services.engine.fees import calculate_fee
from apps.loans.services.engine.aging import classify_loan_aging
from apps.loans.services.engine.interest import round2
from apps.loans.services.accounting import record_disbursement_journal


class LoanViewSet(viewsets.ModelViewSet):
    """
    Complete Loan account lifecycle and management API.
    """
    queryset = Loan.objects.all().select_related("member", "loan_product").prefetch_related("schedule_entries", "guarantors", "collaterals")
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "loan_number",
        "member__first_name",
        "member__other_names",
        "member__national_id",
        "member__phone_number",
        "member__membership_number",
        "loan_product__product_name",
    ]
    ordering_fields = ["application_date", "disbursement_date", "outstanding_balance", "created_at"]
    ordering = ["-application_date", "-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return LoanListSerializer
        elif self.action == "create":
            return LoanApplicationSerializer
        return LoanDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        member_id = self.request.query_params.get("member_id")
        if status_param:
            qs = qs.filter(status=status_param)
        if member_id:
            qs = qs.filter(member_id=member_id)
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        product: LoanProduct = serializer.validated_data["loan_product"]
        guarantors_data = serializer.validated_data.pop("guarantors_data", [])
        collaterals_data = serializer.validated_data.pop("collaterals_data", [])

        # Auto-generate unique loan number (e.g. LN-000001)
        count = Loan.objects.count() + 1
        loan_number = f"LN-{count:06d}"

        app_date = serializer.validated_data.get("application_date") or timezone.now().date()
        principal = serializer.validated_data["principal_amount"]

        # Determine if direct approval or appraisal needed based on product config
        init_status = LoanStatus.PENDING_APPLICATION

        loan = serializer.save(
            loan_number=loan_number,
            application_date=app_date,
            interest_rate=product.interest_rate,
            interest_method=product.interest_method,
            repayment_frequency=product.repayment_frequency,
            status=init_status,
            principal_balance=principal,
            outstanding_balance=principal,
            organization=product.organization,
        )

        for g in guarantors_data:
            LoanGuarantor.objects.create(loan=loan, **g)

        for c in collaterals_data:
            LoanCollateral.objects.create(loan=loan, **c)

        # Trigger Loan Application Confirmation SMS
        try:
            from apps.common.notification_service import NotificationService
            NotificationService.notify_loan_application(loan)
        except Exception as notif_err:
            logger.error(f"Failed to dispatch loan application SMS for {loan.loan_number}: {notif_err}")

        return loan

    @action(detail=False, methods=["post"], url_path="calculate_preview")
    def calculate_preview(self, request):
        """
        Public / authenticated calculation preview endpoint for what-if loan scenarios.
        """
        serializer = LoanCalculatorPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        principal = data["principal"]
        num_periods = data["num_periods"]
        start_date = data.get("start_date") or timezone.now().date()

        # If loan_product_id is provided, pull rates and fee settings from product
        product_id = data.get("loan_product_id")
        fees_list = []
        if product_id:
            try:
                product = LoanProduct.objects.get(id=product_id)
                rate = product.interest_rate
                method = product.interest_method
                period = product.interest_period
                freq = product.repayment_frequency
                for fee in product.fees.all():
                    calc = calculate_fee(
                        fee_name=fee.fee_name,
                        fee_type=fee.fee_type,
                        fee_value=fee.fee_value,
                        fee_basis=fee.fee_basis,
                        principal=principal,
                        affects_principal=fee.affects_principal,
                    )
                    fees_list.append({
                        "fee_name": calc.fee_name,
                        "amount": str(calc.calculated_amount),
                        "affects_principal": calc.affects_principal,
                    })
            except LoanProduct.DoesNotExist:
                return Response({"error": "Loan product not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            rate = data.get("interest_rate", Decimal("1.25"))
            method = data.get("interest_method", "reducing_balance")
            period = data.get("interest_period", "monthly")
            freq = data.get("repayment_frequency", "monthly")

        # Generate schedule entries
        schedule = generate_schedule(
            principal=principal,
            interest_rate_pct=rate,
            interest_period=period,
            interest_method=method,
            repayment_frequency=freq,
            num_periods=num_periods,
            disbursement_date=start_date,
        )

        total_interest = sum(item.expected_interest for item in schedule)
        total_payable = sum(item.expected_amount for item in schedule)
        installment = schedule[0].expected_amount if schedule else Decimal("0.00")

        return Response({
            "principal": str(principal),
            "interest_rate": str(rate),
            "interest_method": method,
            "interest_period": period,
            "repayment_frequency": freq,
            "num_periods": num_periods,
            "total_interest": str(round2(total_interest)),
            "total_payable": str(round2(total_payable)),
            "regular_installment": str(installment),
            "fees": fees_list,
            "schedule": [
                {
                    "period_number": s.period_number,
                    "due_date": s.due_date.isoformat(),
                    "expected_amount": str(s.expected_amount),
                    "expected_principal": str(s.expected_principal),
                    "expected_interest": str(s.expected_interest),
                    "opening_balance": str(s.opening_balance),
                    "closing_balance": str(s.closing_balance),
                }
                for s in schedule
            ],
        })

    @action(detail=True, methods=["post"], url_path="appraise")
    def appraise(self, request, pk=None):
        loan = self.get_object()
        if loan.status != LoanStatus.PENDING_APPLICATION:
            return Response(
                {"error": f"Loan cannot be appraised from status '{loan.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        notes = request.data.get("notes", "")
        loan.status = LoanStatus.APPRAISED
        loan.appraisal_notes = notes
        loan.appraised_by = request.user
        loan.appraised_at = timezone.now()
        loan.save()
        return Response(LoanDetailSerializer(loan).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        loan = self.get_object()
        if loan.status not in (LoanStatus.PENDING_APPLICATION, LoanStatus.APPRAISED):
            return Response(
                {"error": f"Loan cannot be approved from status '{loan.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        notes = request.data.get("notes", "")
        approved_amount_raw = request.data.get("approved_amount")
        approval_date_raw = request.data.get("approval_date")

        if approved_amount_raw is not None and str(approved_amount_raw).strip():
            approved_amount = Decimal(str(approved_amount_raw))
        else:
            approved_amount = loan.principal_amount

        if approval_date_raw:
            try:
                approval_date = timezone.datetime.strptime(approval_date_raw, "%Y-%m-%d").date()
            except (ValueError, TypeError):
                approval_date = timezone.now().date()
        else:
            approval_date = timezone.now().date()

        loan.status = LoanStatus.APPROVED
        loan.approved_amount = approved_amount
        loan.approval_date = approval_date
        loan.approval_notes = notes
        loan.approved_by = request.user
        loan.approved_at = timezone.now()

        # Update principal to approved amount for ongoing balances
        loan.principal_amount = approved_amount
        loan.principal_balance = approved_amount
        loan.outstanding_balance = approved_amount
        loan.save()

        # Trigger Loan Approval Confirmation SMS
        try:
            from apps.common.notification_service import NotificationService
            NotificationService.notify_loan_approval(loan)
        except Exception as notif_err:
            logger.error(f"Failed to dispatch loan approval SMS for {loan.loan_number}: {notif_err}")

        return Response(LoanDetailSerializer(loan).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        loan = self.get_object()
        if loan.status in (LoanStatus.ACTIVE, LoanStatus.CLOSED, LoanStatus.WRITTEN_OFF):
            return Response(
                {"error": f"Cannot reject active or closed loan."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reason = request.data.get("reason", "Loan application rejected.")
        loan.status = LoanStatus.REJECTED
        loan.rejection_reason = reason
        loan.rejected_by = request.user
        loan.rejected_at = timezone.now()
        loan.save()
        return Response(LoanDetailSerializer(loan).data)

    @action(detail=True, methods=["post"], url_path="disburse")
    @transaction.atomic
    def disburse(self, request, pk=None):
        loan = self.get_object()
        if loan.status != LoanStatus.APPROVED:
            return Response(
                {"error": f"Loan must be APPROVED before disbursement. Current status: '{loan.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        disb_date_str = request.data.get("disbursement_date")
        try:
            disb_date = (
                timezone.datetime.strptime(disb_date_str, "%Y-%m-%d").date()
                if disb_date_str
                else timezone.now().date()
            )
        except (ValueError, TypeError):
            disb_date = timezone.now().date()

        disb_amount_raw = request.data.get("disbursed_amount")
        if disb_amount_raw is not None and str(disb_amount_raw).strip():
            disbursed_amount = Decimal(str(disb_amount_raw))
        else:
            disbursed_amount = loan.approved_amount or loan.principal_amount

        disbursement_method = request.data.get("disbursement_method", "")
        disbursement_bank = request.data.get("disbursement_bank", "")
        disbursement_reference = request.data.get("disbursement_reference", "")
        disbursement_notes = request.data.get("disbursement_notes", "")

        product = loan.loan_product
        principal = disbursed_amount
        num_periods = loan.num_periods

        # Clear existing schedule entries if any
        loan.schedule_entries.all().delete()

        # Generate amortization schedule using the actual disbursed amount
        schedule = generate_schedule(
            principal=principal,
            interest_rate_pct=loan.interest_rate,
            interest_period=product.interest_period,
            interest_method=loan.interest_method,
            repayment_frequency=loan.repayment_frequency,
            num_periods=num_periods,
            disbursement_date=disb_date,
        )

        total_interest = sum(item.expected_interest for item in schedule)

        # Calculate upfront fees
        total_upfront_fees = Decimal("0.00")
        for fee in product.fees.all():
            calc = calculate_fee(
                fee_name=fee.fee_name,
                fee_type=fee.fee_type,
                fee_value=fee.fee_value,
                fee_basis=fee.fee_basis,
                principal=principal,
                affects_principal=fee.affects_principal,
            )
            if not fee.affects_principal:
                total_upfront_fees += calc.calculated_amount

        # Create schedule entries in DB
        entries_to_create = []
        for s in schedule:
            entries_to_create.append(
                LoanScheduleEntry(
                    loan=loan,
                    period_number=s.period_number,
                    due_date=s.due_date,
                    expected_amount=s.expected_amount,
                    expected_principal=s.expected_principal,
                    expected_interest=s.expected_interest,
                    opening_balance=s.opening_balance,
                    closing_balance=s.closing_balance,
                )
            )
        LoanScheduleEntry.objects.bulk_create(entries_to_create)

        # Update Loan Header with full disbursement audit details
        maturity_date = schedule[-1].due_date if schedule else disb_date
        loan.disbursement_date = disb_date
        loan.maturity_date = maturity_date
        loan.disbursed_amount = disbursed_amount
        loan.disbursement_method = disbursement_method
        loan.disbursement_bank = disbursement_bank
        loan.disbursement_reference = disbursement_reference
        loan.disbursement_notes = disbursement_notes
        loan.disbursed_at = timezone.now()
        loan.status = LoanStatus.ACTIVE
        loan.disbursed_by = request.user
        loan.principal_balance = principal
        loan.interest_balance = total_interest
        loan.outstanding_balance = principal + total_interest
        loan.save()

        # Post Double-Entry Journal Transaction
        record_disbursement_journal(
            loan=loan,
            disbursement_date=disb_date,
            disbursed_amount=principal,
            fee_deductions=total_upfront_fees,
        )

        # Trigger Loan Disbursement Confirmation SMS (Disbursed amount + Regular installment)
        try:
            first_entry = schedule[0] if schedule else None
            inst_amount = first_entry.expected_amount if first_entry else (principal / num_periods)
            first_due = first_entry.due_date if first_entry else disb_date
            from apps.common.notification_service import NotificationService
            NotificationService.notify_loan_disbursement(
                loan=loan,
                installment_amount=inst_amount,
                first_due_date=first_due,
            )
        except Exception as notif_err:
            logger.error(f"Failed to dispatch loan disbursement SMS for {loan.loan_number}: {notif_err}")

        return Response(LoanDetailSerializer(loan).data)

    @action(detail=False, methods=["get"], url_path="aging_report")
    def aging_report(self, request):
        """
        Portfolio at Risk (PAR) Aging Summary.
        """
        active_loans = Loan.objects.filter(
            status__in=[
                LoanStatus.ACTIVE,
                LoanStatus.WATCHFUL,
                LoanStatus.NON_PERFORMING,
                LoanStatus.DOUBTFUL,
            ]
        ).select_related("member", "loan_product")

        today = timezone.now().date()
        summary = {
            "current": {"count": 0, "principal": Decimal("0.00"), "provision": Decimal("0.00")},
            "watchful": {"count": 0, "principal": Decimal("0.00"), "provision": Decimal("0.00")},
            "non_performing": {"count": 0, "principal": Decimal("0.00"), "provision": Decimal("0.00")},
            "doubtful": {"count": 0, "principal": Decimal("0.00"), "provision": Decimal("0.00")},
            "loss": {"count": 0, "principal": Decimal("0.00"), "provision": Decimal("0.00")},
        }

        loans_data = []
        for loan in active_loans:
            # Determine overdue status from earliest unpaid installment
            oldest_unpaid = loan.schedule_entries.filter(is_paid=False).order_by("due_date").first()
            if oldest_unpaid and oldest_unpaid.due_date < today:
                days_overdue = (today - oldest_unpaid.due_date).days
            else:
                days_overdue = 0

            aging = classify_loan_aging(
                days_overdue=days_overdue,
                outstanding_balance=loan.outstanding_balance,
            )

            # Update status if delinquent
            if aging.category == "watchful" and loan.status != LoanStatus.WATCHFUL:
                loan.status = LoanStatus.WATCHFUL
                loan.days_overdue = days_overdue
                loan.save(update_fields=["status", "days_overdue"])
            elif aging.category == "non_performing" and loan.status != LoanStatus.NON_PERFORMING:
                loan.status = LoanStatus.NON_PERFORMING
                loan.days_overdue = days_overdue
                loan.save(update_fields=["status", "days_overdue"])
            elif aging.category == "doubtful" and loan.status != LoanStatus.DOUBTFUL:
                loan.status = LoanStatus.DOUBTFUL
                loan.days_overdue = days_overdue
                loan.save(update_fields=["status", "days_overdue"])

            summary[aging.category]["count"] += 1
            summary[aging.category]["principal"] += loan.outstanding_balance
            summary[aging.category]["provision"] += aging.provision_amount

            loans_data.append({
                "id": loan.id,
                "loan_number": loan.loan_number,
                "member_name": f"{loan.member.first_name} {loan.member.other_names}",
                "product_name": loan.loan_product.product_name,
                "outstanding_balance": str(loan.outstanding_balance),
                "days_overdue": days_overdue,
                "category": aging.category,
                "provision_amount": str(aging.provision_amount),
            })

        return Response({
            "summary": {
                k: {
                    "count": v["count"],
                    "principal": str(round2(v["principal"])),
                    "provision": str(round2(v["provision"])),
                }
                for k, v in summary.items()
            },
            "loans": loans_data,
        })

    @action(detail=False, methods=["post"], url_path="send_overdue_alerts")
    def send_overdue_alerts(self, request):
        """
        Batch-triggers Overdue Delinquency SMS alerts to active borrowers with overdue installments.
        """
        from apps.common.notification_service import NotificationService

        today = timezone.now().date()
        active_loans = Loan.objects.filter(
            status__in=[
                LoanStatus.ACTIVE,
                LoanStatus.WATCHFUL,
                LoanStatus.NON_PERFORMING,
                LoanStatus.DOUBTFUL,
            ]
        ).select_related("member", "loan_product")

        dispatched = 0
        failed = 0
        results = []

        for loan in active_loans:
            oldest_unpaid = loan.schedule_entries.filter(is_paid=False).order_by("due_date").first()
            if oldest_unpaid and oldest_unpaid.due_date < today:
                days_overdue = (today - oldest_unpaid.due_date).days
                overdue_amount = oldest_unpaid.total_due
                res = NotificationService.notify_overdue_loan(
                    loan=loan,
                    days_overdue=days_overdue,
                    overdue_amount=overdue_amount,
                )
                if res.get("success"):
                    dispatched += 1
                else:
                    failed += 1
                results.append({
                    "loan_number": loan.loan_number,
                    "member": f"{loan.member.first_name} {loan.member.other_names}".strip(),
                    "phone": loan.member.phone_number,
                    "days_overdue": days_overdue,
                    "overdue_amount": str(overdue_amount),
                    "status": "Sent" if res.get("success") else "Failed",
                })

        return Response({
            "success": True,
            "message": f"Overdue alerts dispatched to {dispatched} borrowers ({failed} failed).",
            "dispatched_count": dispatched,
            "failed_count": failed,
            "results": results,
        })
