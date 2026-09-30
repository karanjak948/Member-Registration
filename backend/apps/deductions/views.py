import csv
import io
from decimal import Decimal
from django.db.models import Q, Sum, Count
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.deductions.models import MonthlyDeduction, MonthlyDeductionBatch
from apps.deductions.serializers import (
    MonthlyDeductionSerializer,
    MonthlyDeductionCreateUpdateSerializer,
    MonthlyDeductionBatchSerializer,
)
from apps.deductions.services.generator import generate_monthly_deductions
from apps.deductions.services.uploader import process_deductions_bulk_upload
from apps.deductions.services.template import generate_deductions_template
from apps.organizations.models import Organization


class MonthlyDeductionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing, generating, editing, and uploading monthly SACCO check-off deductions.
    """
    serializer_class = MonthlyDeductionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "member__first_name",
        "member__other_names",
        "member__membership_number",
        "member__national_id",
        "member__phone_number",
    ]
    ordering_fields = [
        "member__first_name",
        "member__membership_number",
        "total_expected",
        "amount_paid",
        "balance",
        "status",
        "charges",
        "loan_principal",
        "loan_interest",
        "savings",
    ]
    ordering = ["member__first_name"]

    def _get_org(self):
        org = getattr(self.request.user, "organization", None)
        if not org:
            org = Organization.objects.first()
        return org

    def get_queryset(self):
        org = self._get_org()
        qs = MonthlyDeduction.objects.select_related("member", "member__category", "organization")
        if org:
            qs = qs.filter(organization=org)

        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")
        status_val = self.request.query_params.get("status")

        if month:
            qs = qs.filter(month=month)
        if year:
            qs = qs.filter(year=year)
        if status_val:
            qs = qs.filter(status=status_val)

        return qs

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return MonthlyDeductionCreateUpdateSerializer
        return MonthlyDeductionSerializer

    def perform_create(self, serializer):
        org = self._get_org()
        serializer.save(
            organization=org,
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        """
        Generate monthly deductions for all active members for a given month & year.
        """
        org = self._get_org()
        month = request.data.get("month")
        year = request.data.get("year")

        if not month or not year:
            return Response(
                {"error": "Both 'month' and 'year' parameters are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            month = int(month)
            year = int(year)
            if not (1 <= month <= 12):
                raise ValueError()
        except ValueError:
            return Response(
                {"error": "Invalid month or year provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        default_savings = Decimal(str(request.data.get("default_savings") or "1500.00"))
        default_shares = Decimal(str(request.data.get("default_shares") or "0.00"))

        result = generate_monthly_deductions(
            organization=org,
            month=month,
            year=year,
            user=request.user,
            force_regenerate=False,
            default_savings=default_savings,
            default_shares=default_shares,
        )

        return Response(
            {
                "message": f"Successfully generated deductions for {month}/{year}.",
                "data": result,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="regenerate")
    def regenerate(self, request):
        """
        Regenerate/recalculate monthly deductions for a given month & year.
        Preserves existing payment records and custom overrides.
        """
        org = self._get_org()
        month = request.data.get("month")
        year = request.data.get("year")

        if not month or not year:
            return Response(
                {"error": "Both 'month' and 'year' parameters are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return Response(
                {"error": "Invalid month or year provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        default_savings = Decimal(str(request.data.get("default_savings") or "1500.00"))
        default_shares = Decimal(str(request.data.get("default_shares") or "0.00"))

        result = generate_monthly_deductions(
            organization=org,
            month=month,
            year=year,
            user=request.user,
            force_regenerate=True,
            default_savings=default_savings,
            default_shares=default_shares,
        )

        return Response(
            {
                "message": f"Successfully regenerated deductions for {month}/{year}.",
                "data": result,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Returns KPI summary metrics for selected month & year.
        """
        qs = self.get_queryset()
        aggregates = qs.aggregate(
            total_expected=Sum("total_expected"),
            total_paid=Sum("amount_paid"),
            total_balance=Sum("balance"),
            total_charges=Sum("charges"),
            total_principal=Sum("loan_principal"),
            total_interest=Sum("loan_interest"),
            total_savings=Sum("savings"),
            total_shares=Sum("shares"),
            total_others=Sum("others"),
            count=Count("id"),
        )

        pending_count = qs.filter(status=MonthlyDeduction.DeductionStatus.PENDING).count()
        partial_count = qs.filter(status=MonthlyDeduction.DeductionStatus.PARTIAL).count()
        paid_count = qs.filter(status=MonthlyDeduction.DeductionStatus.PAID).count()
        overpaid_count = qs.filter(status=MonthlyDeduction.DeductionStatus.OVERPAID).count()

        return Response({
            "total_expected": aggregates["total_expected"] or "0.00",
            "total_paid": aggregates["total_paid"] or "0.00",
            "total_balance": aggregates["total_balance"] or "0.00",
            "total_charges": aggregates["total_charges"] or "0.00",
            "total_principal": aggregates["total_principal"] or "0.00",
            "total_interest": aggregates["total_interest"] or "0.00",
            "total_savings": aggregates["total_savings"] or "0.00",
            "total_shares": aggregates["total_shares"] or "0.00",
            "total_others": aggregates["total_others"] or "0.00",
            "total_members": aggregates["count"] or 0,
            "pending_count": pending_count,
            "partial_count": partial_count,
            "paid_count": paid_count,
            "overpaid_count": overpaid_count,
        })

    @action(detail=False, methods=["get"], url_path="template")
    def template(self, request):
        """
        Download sample or pre-filled Excel template (.xlsx) for bulk deductions upload.
        """
        org = self._get_org()
        month = request.query_params.get("month")
        year = request.query_params.get("year")

        m_int = int(month) if month and month.isdigit() else None
        y_int = int(year) if year and year.isdigit() else None

        excel_bytes = generate_deductions_template(org, m_int, y_int)

        filename = f"monthly_deductions_template_{m_int or 'sample'}_{y_int or ''}.xlsx".replace("__", "_")
        response = HttpResponse(
            excel_bytes,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=["post"], url_path="bulk-upload")
    def bulk_upload(self, request):
        """
        Process Excel (.xlsx) or CSV file with employee deductions remittance.
        Expected columns: EMPLOYEE NO, EMPLOYEE NAME, TOTAL DED.
        """
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"error": "No file uploaded. Please select an Excel (.xlsx) or CSV file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        month = request.data.get("month")
        year = request.data.get("year")
        paid_thro = request.data.get("paid_thro", "payroll")
        date_paid = request.data.get("date_paid")
        remarks = request.data.get("remarks", "")

        if not month or not year:
            return Response(
                {"error": "Both 'month' and 'year' are required fields for bulk upload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return Response(
                {"error": "Invalid numeric month or year."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        org = self._get_org()
        result = process_deductions_bulk_upload(
            file_obj=file_obj,
            month=month,
            year=year,
            paid_thro=paid_thro,
            date_paid=date_paid,
            organization=org,
            user=request.user,
            remarks=remarks,
        )

        if not result.get("success"):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        """
        Export current filtered monthly deductions to CSV.
        """
        qs = self.get_queryset()
        month = request.query_params.get("month", "all")
        year = request.query_params.get("year", "all")

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID",
            "Member Name",
            "Payroll/Member No",
            "Month",
            "Year",
            "Charges",
            "Loan Installment",
            "Loan Interest",
            "Registration Fee",
            "Savings",
            "Shares",
            "Others",
            "Total Expected",
            "Amount Paid",
            "Balance",
            "Status",
        ])

        for d in qs:
            writer.writerow([
                d.id,
                d.member.full_name,
                d.member.membership_number,
                d.month,
                d.year,
                d.charges,
                d.loan_principal,
                d.loan_interest,
                d.registration_fee,
                d.savings,
                d.shares,
                d.others,
                d.total_expected,
                d.amount_paid,
                d.balance,
                d.status,
            ])

        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="monthly_deductions_{month}_{year}.csv"'
        return response


class MonthlyDeductionBatchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only audit log of bulk deduction uploads.
    """
    serializer_class = MonthlyDeductionBatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request.user, "organization", None)
        if not org:
            org = Organization.objects.first()
        qs = MonthlyDeductionBatch.objects.select_related("organization", "uploaded_by")
        if org:
            qs = qs.filter(organization=org)
        return qs
