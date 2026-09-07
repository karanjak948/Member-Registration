from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.loans.models import Loan, LoanStatus
from apps.common.notification_service import NotificationService


class Command(BaseCommand):
    help = "Dispatches SMS overdue delinquency notices to all members with late loan installments."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Checking active loans for overdue installments..."))

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

        for loan in active_loans:
            oldest_unpaid = loan.schedule_entries.filter(is_paid=False).order_by("due_date").first()
            if oldest_unpaid and oldest_unpaid.due_date < today:
                days_overdue = (today - oldest_unpaid.due_date).days
                overdue_amount = oldest_unpaid.total_due

                self.stdout.write(
                    f"Processing Loan {loan.loan_number}: {loan.member} ({days_overdue} days late, KES {overdue_amount})"
                )

                res = NotificationService.notify_overdue_loan(
                    loan=loan,
                    days_overdue=days_overdue,
                    overdue_amount=overdue_amount,
                )

                if res.get("success"):
                    dispatched += 1
                    self.stdout.write(self.style.SUCCESS(f"  -> SMS sent to {loan.member.phone_number}"))
                else:
                    failed += 1
                    self.stdout.write(self.style.ERROR(f"  -> Failed: {res.get('error')}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nOverdue SMS notification complete. Sent: {dispatched}, Failed: {failed}."
            )
        )
