from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.savings.models import SavingsPayment
from apps.savings.serializers import (
    SavingsPaymentSerializer,
    SavingsPaymentCreateSerializer,
)


class SavingsPaymentViewSet(viewsets.ModelViewSet):
    """
    API endpoints for Member Personal Account (MPA) savings payments and register.
    """
    queryset = (
        SavingsPayment.objects
        .select_related("member", "organization", "recorded_by")
        .all()
    )
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "document_no",
        "transaction_no",
        "paid_by",
        "remarks",
        "member__first_name",
        "member__other_names",
        "member__membership_number",
        "member__phone_number",
        "bank_name",
    ]
    ordering_fields = ["paid_on", "created_at", "amount", "document_no"]
    ordering = ["-paid_on", "-created_at"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return SavingsPaymentCreateSerializer
        return SavingsPaymentSerializer

    def destroy(self, request, *args, **kwargs):
        from apps.organizations.permissions import is_admin_or_owner_user
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can delete savings payments."},
                status=status.HTTP_403_FORBIDDEN,
            )
        payment = self.get_object()
        if hasattr(payment, "ledger_transaction") and payment.ledger_transaction:
            payment.ledger_transaction.entries.all().delete()
            payment.ledger_transaction.delete()
        return super().destroy(request, *args, **kwargs)


    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # Multi-tenant isolation if user has organization
        if hasattr(user, "organization") and user.organization:
            qs = qs.filter(organization=user.organization)

        # Filters
        member_id = self.request.query_params.get("member")
        if member_id:
            qs = qs.filter(member_id=member_id)

        savings_type = self.request.query_params.get("savings_type")
        if savings_type:
            qs = qs.filter(savings_type=savings_type)

        payment_mode = self.request.query_params.get("payment_mode")
        if payment_mode:
            qs = qs.filter(payment_mode=payment_mode)

        year = self.request.query_params.get("year")
        if year:
            qs = qs.filter(year=year)

        month = self.request.query_params.get("month")
        if month:
            qs = qs.filter(month=month)

        week = self.request.query_params.get("week")
        if week:
            qs = qs.filter(week=week)

        return qs

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Aggregate KPI statistics for the savings dashboard & register:
        - TRANSACTIONS (count)
        - TOTAL SAVINGS (sum of Money In - Money Out)
        - Normal savings vs. Welfare breakdown
        """
        qs = self.get_queryset()

        total_txns = qs.count()

        money_in = qs.filter(
            transaction_type=SavingsPayment.TransactionType.MONEY_IN
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        money_out = qs.filter(
            transaction_type=SavingsPayment.TransactionType.MONEY_OUT
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        normal_savings = qs.filter(
            savings_type=SavingsPayment.SavingsType.NORMAL,
            transaction_type=SavingsPayment.TransactionType.MONEY_IN,
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        welfare_savings = qs.filter(
            savings_type=SavingsPayment.SavingsType.WELFARE,
            transaction_type=SavingsPayment.TransactionType.MONEY_IN,
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        net_savings = money_in - money_out

        return Response({
            "transactions_count": total_txns,
            "total_savings": str(money_in),
            "net_savings": str(net_savings),
            "total_money_in": str(money_in),
            "total_money_out": str(money_out),
            "normal_savings": str(normal_savings),
            "welfare_savings": str(welfare_savings),
        })

    @action(detail=False, methods=["get"], url_path="download-template")
    def download_template(self, request):
        """
        Download CSV template for bulk savings payments upload.
        """
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="savings_payment_template.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Member No",
            "Savings Type",
            "Amount",
            "Payment Mode",
            "Paid On",
            "Bank Name",
            "Transaction No",
            "Paid By",
            "Remarks",
        ])
        writer.writerow([
            "RC-00001",
            "Normal",
            "2500.00",
            "M-Pesa",
            timezone.now().strftime("%Y-%m-%d"),
            "Co-operative Bank",
            "QWE1234567",
            "John Doe",
            "Monthly savings contribution",
        ])
        writer.writerow([
            "RC-00002",
            "Welfare",
            "500.00",
            "Cash",
            timezone.now().strftime("%Y-%m-%d"),
            "",
            "",
            "Jane Smith",
            "Weekly welfare contribution",
        ])
        return response

    @action(detail=False, methods=["post"], url_path="bulk-upload")
    def bulk_upload(self, request):
        """
        Bulk upload savings payments from CSV or Excel file.
        Automatically resolves members, validates amounts and dates, creates records,
        and posts balanced double-entry transactions to the General Ledger.
        """
        import csv
        import io
        from datetime import datetime, date
        from django.db import transaction
        from apps.members.models import Member
        from apps.savings.serializers import SavingsPaymentCreateSerializer

        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"error": "No file uploaded. Please select a CSV or Excel file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        filename = file_obj.name.lower()
        rows_data = []

        try:
            if filename.endswith(".xlsx") or filename.endswith(".xls"):
                import openpyxl
                wb = openpyxl.load_workbook(file_obj, data_only=True)
                sheet = wb.active
                raw_rows = list(sheet.iter_rows(values_only=True))
                if not raw_rows:
                    return Response({"error": "The uploaded Excel sheet is empty."}, status=400)
                headers = [str(c or "").strip().lower().replace(" ", "_") for c in raw_rows[0]]
                for r in raw_rows[1:]:
                    if any(c is not None and str(c).strip() != "" for c in r):
                        rows_data.append(dict(zip(headers, r)))
            else:
                # CSV processing
                content = file_obj.read()
                try:
                    text = content.decode("utf-8-sig")
                except UnicodeDecodeError:
                    text = content.decode("latin-1")
                reader = csv.DictReader(io.StringIO(text))
                for row in reader:
                    normalized_row = {
                        str(k or "").strip().lower().replace(" ", "_"): v
                        for k, v in row.items()
                    }
                    if any(str(v or "").strip() != "" for v in normalized_row.values()):
                        rows_data.append(normalized_row)
        except Exception as exc:
            return Response(
                {"error": f"Failed to parse uploaded file: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not rows_data:
            return Response(
                {"error": "No data rows found in the uploaded file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        org = getattr(user, "organization", None)
        errors = []
        parsed_items = []

        for idx, row in enumerate(rows_data, start=2):
            # 1. Resolve member identifier
            member_identifier = (
                row.get("member_no")
                or row.get("membership_no")
                or row.get("member_number")
                or row.get("member")
                or row.get("national_id")
                or row.get("id_no")
                or row.get("phone")
                or row.get("phone_number")
            )
            if not member_identifier or str(member_identifier).strip() == "":
                errors.append(f"Row {idx}: Missing member identifier (e.g. Member No or ID).")
                continue

            member_str = str(member_identifier).strip()
            member_qs = Member.objects.all()
            if org:
                member_qs = member_qs.filter(organization=org)

            member_match = member_qs.filter(
                Q(membership_number__iexact=member_str)
                | Q(national_id__iexact=member_str)
                | Q(phone_number__icontains=member_str)
            ).first()

            if not member_match:
                errors.append(f"Row {idx}: Member '{member_str}' not found in directory.")
                continue

            # 2. Resolve amount
            raw_amount = (
                row.get("amount")
                or row.get("money_in")
                or row.get("savings_amount")
                or row.get("value")
            )
            if raw_amount is None or str(raw_amount).strip() == "":
                errors.append(f"Row {idx}: Missing payment amount.")
                continue

            try:
                amt_cleaned = (
                    str(raw_amount)
                    .replace("KES", "")
                    .replace("KSH", "")
                    .replace(",", "")
                    .strip()
                )
                amount = Decimal(amt_cleaned)
                if amount <= 0:
                    errors.append(f"Row {idx}: Amount must be greater than zero.")
                    continue
            except Exception:
                errors.append(f"Row {idx}: Invalid numeric amount '{raw_amount}'.")
                continue

            # 3. Resolve Savings Type
            raw_type = str(
                row.get("savings_type") or row.get("type") or "normal"
            ).strip().lower()
            savings_type = "welfare" if "welf" in raw_type else "normal"

            # 4. Resolve Payment Mode
            raw_mode = str(
                row.get("payment_mode") or row.get("mode") or "mpesa"
            ).strip().lower()
            if any(k in raw_mode for k in ["mpesa", "m-pesa", "mobile"]):
                payment_mode = "mpesa"
            elif "bank" in raw_mode:
                payment_mode = "bank"
            elif "cheq" in raw_mode:
                payment_mode = "cheque"
            else:
                payment_mode = "cash"

            # 5. Resolve Payment Date
            raw_date = (
                row.get("paid_on")
                or row.get("date")
                or row.get("payment_date")
            )
            paid_on_str = timezone.now().strftime("%Y-%m-%d")
            if raw_date:
                if isinstance(raw_date, (datetime, date)):
                    paid_on_str = raw_date.strftime("%Y-%m-%d")
                else:
                    date_val = str(raw_date).strip()
                    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y", "%Y/%m/%d"):
                        try:
                            paid_on_str = datetime.strptime(date_val, fmt).strftime("%Y-%m-%d")
                            break
                        except ValueError:
                            pass

            # 6. Additional details
            bank_name = str(row.get("bank_name") or row.get("bank") or "").strip()
            transaction_no = str(
                row.get("transaction_no")
                or row.get("reference")
                or row.get("ref")
                or row.get("mpesa_code")
                or ""
            ).strip()
            paid_by = str(
                row.get("paid_by")
                or row.get("depositor")
                or member_match.full_name
            ).strip()
            remarks = str(
                row.get("remarks")
                or row.get("remark")
                or row.get("notes")
                or f"Bulk upload import for {member_match.membership_number}"
            ).strip()

            parsed_items.append({
                "member": member_match.id,
                "amount": str(amount),
                "savings_type": savings_type,
                "transaction_type": "money_in",
                "payment_mode": payment_mode,
                "bank_name": bank_name,
                "transaction_no": transaction_no,
                "paid_on": paid_on_str,
                "paid_by": paid_by,
                "remarks": remarks,
            })

        # Check for errors
        if errors:
            return Response(
                {
                    "success": False,
                    "imported_count": 0,
                    "errors": errors,
                    "total_rows": len(rows_data),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Execute creation within atomic transaction
        created_count = 0
        total_amount = Decimal("0.00")
        with transaction.atomic():
            for item_data in parsed_items:
                serializer = SavingsPaymentCreateSerializer(
                    data=item_data, context={"request": request}
                )
                serializer.is_valid(raise_exception=True)
                serializer.save()
                created_count += 1
                total_amount += Decimal(item_data["amount"])

        return Response({
            "success": True,
            "imported_count": created_count,
            "total_amount": str(total_amount),
            "errors": [],
            "message": f"Successfully imported {created_count} savings payments totalling KES {total_amount:,.2f}.",
        })
