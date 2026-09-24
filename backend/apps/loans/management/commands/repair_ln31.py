from django.core.management.base import BaseCommand
from repair_ln31 import repair_loan_31


class Command(BaseCommand):
    help = "Repairs loan LN-000031 and aligns its balances to Peter Irungu's Reducing Balance single-balance model."

    def handle(self, *args, **options):
        success = repair_loan_31()
        if success:
            self.stdout.write(self.style.SUCCESS("Successfully repaired LN-000031!"))
        else:
            self.stdout.write(self.style.ERROR("Could not find or repair LN-000031."))
