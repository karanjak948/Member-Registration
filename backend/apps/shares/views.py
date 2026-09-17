from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.shares.models import SharePayment
from apps.shares.serializers import (
    SharePaymentSerializer,
    SharePaymentCreateSerializer,
)


class SharePaymentViewSet(viewsets.ModelViewSet):
    """
    API endpoints for SACCO Member Share Capital payments and register.
    """
    queryset = (
        SharePayment.objects
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
    ordering_fields = ["paid_on", "created_at", "total_amount", "document_no"]
    ordering = ["-paid_on", "-created_at"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return SharePaymentCreateSerializer
        return SharePaymentSerializer

    def destroy(self, request, *args, **kwargs):
        from apps.organizations.permissions import is_admin_or_owner_user
        if not is_admin_or_owner_user(request.user):
            return Response(
                {"error": "Permission denied. Only administrators or organization owners can delete share payments."},
                status=status.HTTP_403_FORBIDDEN,
            )
        payment = self.get_object()
        # Delete linked ledger transaction if any
        from apps.loans.models import LedgerTransaction
        LedgerTransaction.objects.filter(
            reference_type="SHARES",
            reference_id=payment.document_no,
        ).delete()
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if hasattr(user, "organization") and user.organization:
            qs = qs.filter(organization=user.organization)

        member_id = self.request.query_params.get("member")
        if member_id:
            qs = qs.filter(member_id=member_id)

        share_type = self.request.query_params.get("share_type")
        if share_type:
            qs = qs.filter(share_type=share_type)

        payment_mode = self.request.query_params.get("payment_mode")
        if payment_mode:
            qs = qs.filter(payment_mode=payment_mode)

        year = self.request.query_params.get("year")
        if year:
            qs = qs.filter(year=year)

        month = self.request.query_params.get("month")
        if month:
            qs = qs.filter(month=month)

        return qs

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Aggregate KPI statistics for the Shares dashboard & register:
        - TRANSACTIONS (count)
        - TOTAL SHARE CAPITAL (sum of total_amount)
        - TOTAL SHARES ISSUED (sum of number_of_shares)
        - UNIQUE SHAREHOLDERS (count of distinct members)
        - Breakdown by share type
        """
        qs = self.get_queryset()

        total_txns = qs.count()
        total_amount = qs.aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")
        total_shares = qs.aggregate(total=Sum("number_of_shares"))["total"] or Decimal("0.00")
        shareholders_count = qs.values("member_id").distinct().count()

        ordinary_amount = qs.filter(
            share_type=SharePayment.ShareType.ORDINARY
        ).aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")

        preference_amount = qs.filter(
            share_type=SharePayment.ShareType.PREFERENCE
        ).aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")

        capital_amount = qs.filter(
            share_type=SharePayment.ShareType.CAPITAL
        ).aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")

        return Response({
            "transactions_count": total_txns,
            "total_share_capital": str(total_amount),
            "total_shares_issued": str(total_shares),
            "shareholders_count": shareholders_count,
            "ordinary_shares_amount": str(ordinary_amount),
            "preference_shares_amount": str(preference_amount),
            "capital_shares_amount": str(capital_amount),
        })

    @action(detail=False, methods=["get"], url_path="download-template")
    def download_template(self, request):
        """
        Download CSV template for bulk share payments upload.
        """
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="shares_payment_template.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Member No",
            "Share Type",
            "Number Of Shares",
            "Share Price",
            "Payment Mode",
            "Paid On",
            "Bank Name",
            "Transaction No",
            "Paid By",
            "Remarks",
        ])
        writer.writerow([
            "RC-00001",
            "Ordinary",
            "10",
            "100.00",
            "M-Pesa",
            timezone.now().strftime("%Y-%m-%d"),
            "Co-operative Bank",
            "SHR1234567",
            "John Doe",
            "Purchase of 10 Ordinary shares",
        ])
        writer.writerow([
            "RC-00002",
            "Preference",
            "50",
            "100.00",
            "Cash",
            timezone.now().strftime("%Y-%m-%d"),
            "",
            "",
            "Jane Smith",
            "Purchase of 50 Preference shares",
        ])
        return response

    @action(detail=False, methods=["post"], url_path="bulk-upload")
    def bulk_upload(self, request):
        """
        Bulk upload share payments from CSV or Excel file.
        """
        import csv
        import io
        from datetime import datetime, date
        from django.db import transaction
        from apps.members.models import Member

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
                errors.append(f"Row {idx}: Missing member identifier.")
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

            raw_shares = row.get("number_of_shares") or row.get("no_of_shares") or row.get("shares") or 1
            raw_price = row.get("share_price") or row.get("shares_amount") or row.get("price") or 100

            try:
                num_shares = Decimal(str(raw_shares).replace(",", "").strip())
                share_price = Decimal(str(raw_price).replace("KES", "").replace(",", "").strip())
                if num_shares <= 0 or share_price <= 0:
                    errors.append(f"Row {idx}: Shares count and price must be greater than zero.")
                    continue
            except Exception:
                errors.append(f"Row {idx}: Invalid numeric shares or price.")
                continue

            raw_type = str(row.get("share_type") or row.get("type") or "ordinary").strip().lower()
            if "pref" in raw_type:
                share_type = "preference"
            elif "cap" in raw_type:
                share_type = "capital"
            else:
                share_type = "ordinary"

            raw_mode = str(row.get("payment_mode") or row.get("mode") or "mpesa").strip().lower()
            if any(k in raw_mode for k in ["mpesa", "m-pesa", "mobile"]):
                payment_mode = "mpesa"
            elif "bank" in raw_mode:
                payment_mode = "bank"
            elif "cheq" in raw_mode:
                payment_mode = "cheque"
            else:
                payment_mode = "cash"

            raw_date = row.get("paid_on") or row.get("date")
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

            bank_name = str(row.get("bank_name") or row.get("bank") or "").strip()
            transaction_no = str(row.get("transaction_no") or row.get("reference") or "").strip()
            paid_by = str(row.get("paid_by") or member_match.full_name).strip()
            remarks = str(row.get("remarks") or f"Bulk upload share purchase for {member_match.membership_number}").strip()

            parsed_items.append({
                "member": member_match.id,
                "share_type": share_type,
                "number_of_shares": str(num_shares),
                "share_price": str(share_price),
                "payment_mode": payment_mode,
                "bank_name": bank_name,
                "transaction_no": transaction_no,
                "paid_on": paid_on_str,
                "paid_by": paid_by,
                "remarks": remarks,
            })

        if errors:
            return Response(
                {"success": False, "imported_count": 0, "errors": errors, "total_rows": len(rows_data)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_count = 0
        total_amount = Decimal("0.00")
        with transaction.atomic():
            for item_data in parsed_items:
                serializer = SharePaymentCreateSerializer(
                    data=item_data, context={"request": request}
                )
                serializer.is_valid(raise_exception=True)
                inst = serializer.save()
                created_count += 1
                total_amount += inst.total_amount

        return Response({
            "success": True,
            "imported_count": created_count,
            "total_amount": str(total_amount),
            "errors": [],
            "message": f"Successfully imported {created_count} share payments totalling KES {total_amount:,.2f}.",
        })
