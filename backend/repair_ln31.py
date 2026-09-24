"""
Management command / script to repair LN-000031 and align its repayment and schedule
to Peter Irungu's Reducing Balance single-balance model.

Usage:
  python manage.py repair_ln31
Or:
  venv/bin/python repair_ln31.py
"""

import os
import sys
from decimal import Decimal

# Set up Django environment if run as standalone script
if not os.environ.get("DJANGO_SETTINGS_MODULE"):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    import django
    django.setup()

from apps.loans.models import Loan, Repayment
from apps.loans.models.loan_schedule import LoanScheduleEntry


def repair_loan_31():
    # Find loan LN-000031
    loan = Loan.objects.filter(loan_number__icontains="000031").first()
    if not loan:
        loan = Loan.objects.filter(id=31).first()

    if not loan:
        print("[-] Loan LN-000031 (ID 31) not found in database.")
        return False

    print(f"[+] Found Loan: {loan.loan_number} (ID: {loan.id})")
    print(f"    Current Principal Balance: KES {loan.principal_balance}")
    print(f"    Current Interest Balance:  KES {loan.interest_balance}")
    print(f"    Current Outstanding Bal:   KES {loan.outstanding_balance}")
    print(f"    Current Principal Paid:    KES {loan.total_principal_paid}")
    print(f"    Current Interest Paid:     KES {loan.total_interest_paid}")

    # 1. Update Repayment #1
    repayment = Repayment.objects.filter(loan=loan).order_by("payment_date", "id").first()
    if repayment:
        print(f"[+] Updating Repayment #{repayment.repayment_number}:")
        print(f"    Amount Paid: KES {repayment.amount_paid}")
        # Month 1 interest is KES 6,000 for KES 30,000 loan @ 20%
        # The 6,000 payment satisfies Month 1 interest 100%
        repayment.allocated_interest = Decimal("6000.00")
        repayment.allocated_principal = Decimal("0.00")
        repayment.allocated_fees = Decimal("0.00")
        repayment.allocated_penalty = Decimal("0.00")
        repayment.unallocated_amount = Decimal("0.00")
        repayment.save(update_fields=[
            "allocated_interest",
            "allocated_principal",
            "allocated_fees",
            "allocated_penalty",
            "unallocated_amount",
        ])
        print("    [OK] Repayment updated: Allocated Interest = 6,000.00, Allocated Principal = 0.00")

    # 2. Update Schedule Entries
    entries = list(loan.schedule_entries.all().order_by("period_number"))
    if entries:
        print(f"[+] Aligning {len(entries)} Schedule Entries:")
        # Installment #1: Opening: 36,000, Interest: 6,000, Paid: 6,000, Closing: 30,000, Paid: True
        e1 = entries[0]
        e1.opening_balance = Decimal("36000.00")
        e1.expected_interest = Decimal("6000.00")
        e1.expected_principal = Decimal("0.00")
        e1.expected_amount = Decimal("6000.00")
        e1.paid_interest = Decimal("6000.00")
        e1.paid_principal = Decimal("0.00")
        e1.closing_balance = Decimal("30000.00")
        e1.is_paid = True
        if repayment and repayment.payment_date:
            e1.paid_date = repayment.payment_date
        e1.save()
        print("    [OK] Schedule #1: Opening=36,000, Paid Interest=6,000, Closing=30,000 (Paid)")

        # Installment #2 onwards: clear spilled 2,500 principal from Installment #2
        # Opening balance starts at 30,000
        curr_b = Decimal("30000.00")
        for e in entries[1:]:
            e.opening_balance = curr_b
            if e.period_number == 2:
                e.paid_principal = Decimal("0.00")
                e.paid_interest = Decimal("0.00")
                e.is_paid = False
                e.paid_date = None
                e.closing_balance = curr_b
            else:
                e.closing_balance = curr_b
            e.save()
            curr_b = e.closing_balance
        print("    [OK] Subsequent installments aligned to 30,000 opening balance.")

    # 3. Update Loan Header
    loan.principal_balance = Decimal("30000.00")
    loan.interest_balance = Decimal("0.00")
    loan.penalty_balance = Decimal("0.00")
    loan.fees_balance = Decimal("0.00")
    loan.outstanding_balance = Decimal("30000.00")
    loan.total_interest_paid = Decimal("6000.00")
    loan.total_principal_paid = Decimal("0.00")
    loan.total_fees_paid = Decimal("0.00")
    loan.total_penalties_paid = Decimal("0.00")
    loan.save(update_fields=[
        "principal_balance",
        "interest_balance",
        "penalty_balance",
        "fees_balance",
        "outstanding_balance",
        "total_interest_paid",
        "total_principal_paid",
        "total_fees_paid",
        "total_penalties_paid",
    ])

    print("[+] Successfully repaired Loan LN-000031!")
    print(f"    New Principal Balance: KES {loan.principal_balance}")
    print(f"    New Interest Balance:  KES {loan.interest_balance}")
    print(f"    New Outstanding Bal:   KES {loan.outstanding_balance}")
    print(f"    New Principal Paid:    KES {loan.total_principal_paid}")
    print(f"    New Interest Paid:     KES {loan.total_interest_paid}")
    return True


if __name__ == "__main__":
    repair_loan_31()
