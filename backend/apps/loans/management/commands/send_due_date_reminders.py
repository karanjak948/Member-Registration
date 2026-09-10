from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.loans.models import Loan, LoanStatus
from apps.common.notification_service import NotificationService


class Command(BaseCommand):
    help = "Dispatches SMS due date reminders to members with upcoming loan installments."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=3,
            help="Maximum days in advance to send due date reminders (default: 3)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate and display recipients without actually sending SMS",
        )

    def handle(self, *args, **options):
        days_ahead = options["days"]
        dry_run = options.get("dry_run", False)
        today = timezone.now().date()
        target_date = today + timedelta(days=days_ahead)

        self.stdout.write(self.style.NOTICE(f"Checking for loan installments due between {today} and {target_date}... (dry-run={dry_run})"))

        active_loans = Loan.objects.filter(
            status__in=[
                LoanStatus.ACTIVE,
                LoanStatus.WATCHFUL,
            ]
        ).select_related("member", "loan_product")

        dispatched = 0
        failed = 0

        for loan in active_loans:
            upcoming_entry = (
                loan.schedule_entries.filter(
                    is_paid=False,
                    due_date__gte=today,
                    due_date__lte=target_date,
                )
                .order_by("due_date")
                .first()
            )
            if upcoming_entry:
                days_remaining = (upcoming_entry.due_date - today).days
                amt = upcoming_entry.total_due

                self.stdout.write(
                    f"Processing Loan {loan.loan_number}: {loan.member} (due in {days_remaining} days, KES {amt})"
                )

                if dry_run:
                    self.stdout.write(self.style.WARNING(f"  -> [DRY RUN] Would send SMS to {loan.member.phone_number}"))
                    dispatched += 1
                else:
                    res = NotificationService.notify_due_date_reminder(
                        loan=loan,
                        installment_amount=amt,
                        due_date=upcoming_entry.due_date,
                        days_remaining=days_remaining,
                    )

                    if res.get("success"):
                        dispatched += 1
                        self.stdout.write(self.style.SUCCESS(f"  -> SMS sent to {loan.member.phone_number}"))
                    else:
                        failed += 1
                        self.stdout.write(self.style.ERROR(f"  -> Failed: {res.get('error')}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDue date SMS reminder complete. Sent: {dispatched}, Failed: {failed}."
            )
        )
