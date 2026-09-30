import io
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from decimal import Decimal
from apps.deductions.models import MonthlyDeduction
from apps.members.models import Member


def generate_deductions_template(organization=None, month=None, year=None):
    """
    Generates an Excel workbook template (.xlsx) for bulk uploading monthly deductions.
    Columns:
      - EMPLOYEE NO (Member No / Membership Number)
      - EMPLOYEE NAME
      - TOTAL DED (Total Remitted Deduction Amount)

    If month & year are provided, pre-fills active members and expected deductions.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Monthly Deductions"

    # Styling
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1F497D", end_color="1F497D", fill_type="solid")
    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")
    align_right = Alignment(horizontal="right", vertical="center")
    border_thin = Border(
        left=Side(style="thin", color="D9D9D9"),
        right=Side(style="thin", color="D9D9D9"),
        top=Side(style="thin", color="D9D9D9"),
        bottom=Side(style="thin", color="D9D9D9"),
    )

    headers = ["EMPLOYEE NO", "EMPLOYEE NAME", "TOTAL DED"]
    ws.append(headers)

    for col_idx in range(1, 4):
        cell = ws.cell(row=1, column=col_idx)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = align_center if col_idx != 2 else align_left

    ws.column_dimensions["A"].width = 22
    ws.column_dimensions["B"].width = 34
    ws.column_dimensions["C"].width = 18

    # Populate rows
    if organization and month and year:
        deductions = MonthlyDeduction.objects.filter(
            organization=organization,
            month=month,
            year=year,
        ).select_related("member").order_by("member__first_name")

        if deductions.exists():
            for d in deductions:
                m_no = d.member.membership_number
                m_name = d.member.full_name
                tot = float(d.total_expected)
                row_vals = [m_no, m_name, tot]
                ws.append(row_vals)
        else:
            # Fallback to active members
            members = Member.objects.filter(organization=organization).order_by("first_name")[:50]
            for m in members:
                ws.append([m.membership_number, m.full_name, ""])
    else:
        # Sample placeholders as in Screenshot 4
        ws.append(["RC-000001", "Patric Kendi", 9900.00])
        ws.append(["RC-000002", "Jane Nduta", 8200.00])
        ws.append(["RC-000003", "Stephen Omukoto", 4160.00])

    # Format data cells
    for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=3):
        row[0].alignment = align_center
        row[0].border = border_thin
        row[1].alignment = align_left
        row[1].border = border_thin
        row[2].alignment = align_right
        row[2].number_format = "#,##0.00"
        row[2].border = border_thin

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.getvalue()
