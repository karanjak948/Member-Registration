import csv
import io
import openpyxl
from datetime import datetime, date
from decimal import Decimal
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.members.models import Member
from apps.deductions.models import (
    MonthlyDeduction,
    MonthlyDeductionBatch,
    MonthlyDeductionItemLog,
)
from apps.savings.models import SavingsPayment
from apps.shares.models import SharePayment
from apps.loans.models import Loan, LoanStatus
from apps.loans.models.loan_schedule import LoanScheduleEntry


def process_deductions_bulk_upload(
    file_obj,
    month: int,
    year: int,
    paid_thro: str = "payroll",
    date_paid=None,
    organization=None,
    user=None,
    remarks: str = "",
):
    """
    Parses and processes an Excel (.xlsx/.xls) or CSV monthly deductions check-off remittance file.
    Columns:
      EMPLOYEE NO (or MEMBER NO / MEMBERSHIP NO)
      EMPLOYEE NAME (or NAME)
      TOTAL DED (or AMOUNT / TOTAL)

    Applies SACCO waterfall allocation and creates transaction records for
    Savings, Shares, and Loans.
    """
    if not date_paid:
        date_paid = timezone.now().date()
    elif isinstance(date_paid, str):
        try:
            date_paid = datetime.strptime(date_paid, "%Y-%m-%d").date()
        except Exception:
            date_paid = timezone.now().date()

    filename = getattr(file_obj, "name", "file.xlsx").lower()
    rows_data = []

    # 1. Parse File
    if filename.endswith(".xlsx") or filename.endswith(".xls"):
        wb = openpyxl.load_workbook(file_obj, data_only=True)
        sheet = wb.active
        raw_rows = list(sheet.iter_rows(values_only=True))
        if not raw_rows or len(raw_rows) < 2:
            return {
                "success": False,
                "error": "The uploaded spreadsheet is empty or has no data rows.",
                "total_rows": 0,
                "processed": 0,
                "failed": 0,
                "errors": [],
            }

        headers = [
            str(c or "").strip().lower().replace(" ", "_").replace(".", "")
            for c in raw_rows[0]
        ]

        for r in raw_rows[1:]:
            if any(c is not None and str(c).strip() != "" for c in r):
                row_dict = dict(zip(headers, r))
                rows_data.append(row_dict)
    else:
        # CSV parsing
        content = file_obj.read()
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = content.decode("latin-1")
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            normalized_row = {
                str(k or "").strip().lower().replace(" ", "_").replace(".", ""): v
                for k, v in row.items()
            }
            if any(str(v or "").strip() != "" for v in normalized_row.values()):
                rows_data.append(normalized_row)

    if not rows_data:
        return {
            "success": False,
            "error": "No valid data rows found in the uploaded file.",
            "total_rows": 0,
            "processed": 0,
            "failed": 0,
            "errors": [],
        }

    errors = []
    success_items = []
    total_remitted = Decimal("0.00")
    total_savings_allocated = Decimal("0.00")
    total_shares_allocated = Decimal("0.00")
    total_loans_allocated = Decimal("0.00")

    # Determine payment mode for savings/shares models
    mode_str = str(paid_thro or "").lower()
    if "mpesa" in mode_str:
        pmode = SavingsPayment.PaymentMode.MPESA
    elif "cash" in mode_str:
        pmode = SavingsPayment.PaymentMode.CASH
    elif "cheque" in mode_str:
        pmode = SavingsPayment.PaymentMode.CHEQUE
    else:
        pmode = SavingsPayment.PaymentMode.BANK

    # Create Batch log
    from django.core.files.uploadedfile import UploadedFile
    from django.core.files import File as DjangoFile
    file_to_save = file_obj if isinstance(file_obj, (UploadedFile, DjangoFile)) else None
    batch_no = f"DED-BATCH-{year}{month:02d}-{int(timezone.now().timestamp())}"

    batch = MonthlyDeductionBatch.objects.create(
        organization=organization,
        batch_no=batch_no,
        month=month,
        year=year,
        paid_thro=paid_thro,
        date_paid=date_paid,
        uploaded_file=file_to_save,
        remarks=remarks,
        uploaded_by=user,
    )

    with transaction.atomic():
        for idx, row in enumerate(rows_data, start=2):
            # 1. Extract member identifier (EMPLOYEE NO / MEMBER NO) and Name
            emp_no = (
                row.get("employee_no")
                or row.get("employeeno")
                or row.get("payroll_no")
                or row.get("payrollno")
                or row.get("member_no")
                or row.get("memberno")
                or row.get("membership_no")
                or row.get("membership_number")
                or row.get("id_no")
                or row.get("national_id")
            )
            raw_name = (
                row.get("employee_name")
                or row.get("employeename")
                or row.get("member_name")
                or row.get("name")
                or ""
            )

            if not emp_no or str(emp_no).strip() == "":
                err = f"Row {idx}: Missing employee/member number."
                errors.append(err)
                MonthlyDeductionItemLog.objects.create(
                    batch=batch,
                    row_number=idx,
                    raw_employee_no="",
                    raw_employee_name=str(raw_name or ""),
                    raw_total_ded=Decimal("0.00"),
                    status=MonthlyDeductionItemLog.ItemStatus.FAILED,
                    error_message=err,
                    created_by=user,
                )
                continue

            emp_str = str(emp_no).strip()

            # Find member
            member_qs = Member.objects.filter(organization=organization)
            member = member_qs.filter(
                Q(membership_number__iexact=emp_str)
                | Q(national_id__iexact=emp_str)
                | Q(phone_number__icontains=emp_str)
            ).first()

            if not member:
                err = f"Row {idx}: Member '{emp_str}' not found in system."
                errors.append(err)
                MonthlyDeductionItemLog.objects.create(
                    batch=batch,
                    row_number=idx,
                    raw_employee_no=emp_str,
                    raw_employee_name=str(raw_name or ""),
                    raw_total_ded=Decimal("0.00"),
                    status=MonthlyDeductionItemLog.ItemStatus.FAILED,
                    error_message=err,
                    created_by=user,
                )
                continue

            # 2. Extract deduction amount (TOTAL DED)
            raw_amt = (
                row.get("total_ded")
                or row.get("total_deduction")
                or row.get("total")
                or row.get("amount")
                or row.get("deduction")
                or row.get("money_in")
            )

            if raw_amt is None or str(raw_amt).strip() == "":
                err = f"Row {idx} ({member.full_name}): Missing TOTAL DED amount."
                errors.append(err)
                MonthlyDeductionItemLog.objects.create(
                    batch=batch,
                    member=member,
                    row_number=idx,
                    raw_employee_no=emp_str,
                    raw_employee_name=str(raw_name or member.full_name),
                    raw_total_ded=Decimal("0.00"),
                    status=MonthlyDeductionItemLog.ItemStatus.FAILED,
                    error_message=err,
                    created_by=user,
                )
                continue

            try:
                amt_cleaned = (
                    str(raw_amt)
                    .replace("KES", "")
                    .replace("KSH", "")
                    .replace(",", "")
                    .strip()
                )
                remitted_amount = Decimal(amt_cleaned)
                if remitted_amount < 0:
                    err = f"Row {idx} ({member.full_name}): Negative deduction amount."
                    errors.append(err)
                    MonthlyDeductionItemLog.objects.create(
                        batch=batch,
                        member=member,
                        row_number=idx,
                        raw_employee_no=emp_str,
                        raw_employee_name=str(raw_name or member.full_name),
                        raw_total_ded=Decimal("0.00"),
                        status=MonthlyDeductionItemLog.ItemStatus.FAILED,
                        error_message=err,
                        created_by=user,
                    )
                    continue
            except Exception:
                err = f"Row {idx} ({member.full_name}): Invalid amount '{raw_amt}'."
                errors.append(err)
                MonthlyDeductionItemLog.objects.create(
                    batch=batch,
                    member=member,
                    row_number=idx,
                    raw_employee_no=emp_str,
                    raw_employee_name=str(raw_name or member.full_name),
                    raw_total_ded=Decimal("0.00"),
                    status=MonthlyDeductionItemLog.ItemStatus.FAILED,
                    error_message=err,
                    created_by=user,
                )
                continue

            # 3. Get or create MonthlyDeduction record for (org, member, month, year)
            deduction, _ = MonthlyDeduction.objects.get_or_create(
                organization=organization,
                member=member,
                month=month,
                year=year,
                defaults={
                    "created_by": user,
                    "updated_by": user,
                    "paid_thro": paid_thro,
                    "date_paid": date_paid,
                },
            )

            # 4. Waterfall Allocation of Remittance
            # Priority:
            # 1. Charges & Fees
            # 2. Loan Interest
            # 3. Loan Principal
            # 4. Savings
            # 5. Shares
            # 6. Others / Surplus
            remaining_remittance = remitted_amount

            # A. Charges
            alloc_charges = min(remaining_remittance, deduction.charges)
            remaining_remittance -= alloc_charges

            # B. Loan Interest
            alloc_interest = min(remaining_remittance, deduction.loan_interest)
            remaining_remittance -= alloc_interest

            # C. Loan Principal
            alloc_principal = min(remaining_remittance, deduction.loan_principal)
            remaining_remittance -= alloc_principal

            # D. Registration Fee (if unpaid)
            alloc_reg_fee = Decimal("0.00")
            if not getattr(member, "registration_fee_paid", False) and deduction.registration_fee > Decimal("0.00"):
                alloc_reg_fee = min(remaining_remittance, deduction.registration_fee)
                remaining_remittance -= alloc_reg_fee
                if alloc_reg_fee >= deduction.registration_fee:
                    member.registration_fee_paid = True
                    member.save(update_fields=["registration_fee_paid"])

            # E. Savings
            alloc_savings = min(remaining_remittance, deduction.savings)
            remaining_remittance -= alloc_savings

            # F. Shares
            alloc_shares = min(remaining_remittance, deduction.shares)
            remaining_remittance -= alloc_shares

            # G. Others
            alloc_others = min(remaining_remittance, deduction.others)
            remaining_remittance -= alloc_others
            alloc_others += alloc_reg_fee

            # G. Any remaining surplus goes into Savings
            surplus_allocated = Decimal("0.00")
            if remaining_remittance > Decimal("0.00"):
                surplus_allocated = remaining_remittance
                alloc_savings += remaining_remittance
                remaining_remittance = Decimal("0.00")

            # 5. Create actual financial transaction records
            # Savings Payment
            if alloc_savings > Decimal("0.00"):
                SavingsPayment.objects.create(
                    organization=organization,
                    member=member,
                    savings_type=SavingsPayment.SavingsType.NORMAL,
                    transaction_type=SavingsPayment.TransactionType.MONEY_IN,
                    amount=alloc_savings,
                    payment_mode=pmode,
                    paid_on=date_paid,
                    month=month,
                    year=year,
                    remarks=f"Monthly deduction check-off ({month}/{year}) - Batch {batch.batch_no}",
                    recorded_by=user,
                )
                total_savings_allocated += alloc_savings

            # Shares Payment
            if alloc_shares > Decimal("0.00"):
                SharePayment.objects.create(
                    organization=organization,
                    member=member,
                    share_type=SharePayment.ShareType.ORDINARY,
                    number_of_shares=(alloc_shares / Decimal("100.00")).quantize(Decimal("0.01")),
                    share_price=Decimal("100.00"),
                    total_amount=alloc_shares,
                    payment_mode=pmode,
                    paid_on=date_paid,
                    month=month,
                    year=year,
                    remarks=f"Monthly deduction share check-off ({month}/{year}) - Batch {batch.batch_no}",
                    recorded_by=user,
                )
                total_shares_allocated += alloc_shares

            # Loan Schedule Settlement
            loan_allocated = alloc_charges + alloc_interest + alloc_principal
            if loan_allocated > Decimal("0.00"):
                total_loans_allocated += loan_allocated
                schedule_entries = LoanScheduleEntry.objects.filter(
                    loan__member=member,
                    loan__status__in=[
                        LoanStatus.ACTIVE,
                        LoanStatus.WATCHFUL,
                        LoanStatus.NON_PERFORMING,
                    ],
                    due_date__year=year,
                    due_date__month=month,
                    is_paid=False,
                )
                for entry in schedule_entries:
                    entry.paid_principal += min(alloc_principal, entry.expected_principal)
                    entry.paid_interest += min(alloc_interest, entry.expected_interest)
                    entry.paid_fees += min(alloc_charges, entry.expected_fees)
                    if entry.remaining_principal <= 0 and entry.remaining_interest <= 0:
                        entry.is_paid = True
                        entry.paid_date = date_paid
                    entry.save()

            # 6. Update MonthlyDeduction Record
            deduction.amount_paid += remitted_amount
            deduction.paid_thro = paid_thro
            deduction.date_paid = date_paid
            deduction.updated_by = user
            deduction.save()

            # 7. Create Item Log explicitly recording upload data & usage breakdown
            MonthlyDeductionItemLog.objects.create(
                batch=batch,
                deduction=deduction,
                member=member,
                row_number=idx,
                raw_employee_no=emp_str,
                raw_employee_name=str(raw_name or member.full_name),
                raw_total_ded=remitted_amount,
                amount_charges=alloc_charges,
                amount_loan_interest=alloc_interest,
                amount_loan_principal=alloc_principal,
                amount_savings=alloc_savings,
                amount_shares=alloc_shares,
                amount_others=alloc_others,
                amount_surplus=surplus_allocated,
                status=MonthlyDeductionItemLog.ItemStatus.SUCCESS,
                created_by=user,
            )

            total_remitted += remitted_amount
            success_items.append({
                "member_id": member.id,
                "membership_number": member.membership_number,
                "member_name": member.full_name,
                "remitted_amount": str(remitted_amount),
                "savings_allocated": str(alloc_savings),
                "shares_allocated": str(alloc_shares),
                "loan_allocated": str(loan_allocated),
                "new_balance": str(deduction.balance),
                "status": deduction.status,
            })

    # Update Batch record stats
    batch.row_count = len(rows_data)
    batch.success_count = len(success_items)
    batch.error_count = len(errors)
    batch.total_amount = total_remitted
    batch.save()

    return {
        "success": True,
        "batch_no": batch.batch_no,
        "total_rows": len(rows_data),
        "success_count": len(success_items),
        "error_count": len(errors),
        "total_remitted": total_remitted,
        "total_savings_allocated": total_savings_allocated,
        "total_shares_allocated": total_shares_allocated,
        "total_loans_allocated": total_loans_allocated,
        "items": success_items,
        "errors": errors,
    }
