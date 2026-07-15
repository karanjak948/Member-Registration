from django.core.management.base import BaseCommand

from apps.members.models import (
    FieldConfiguration,
    MemberCategory,
    MemberConfiguration,
)


class Command(BaseCommand):
    help = (
        "Seed default member categories, "
        "member configuration and field configuration."
    )

    def handle(self, *args, **options):

        categories = [
            {
                "name": "Normal Member",
                "code": "NORMAL",
                "description": "Normal registered member",
            },
            {
                "name": "Special Member",
                "code": "SPECIAL",
                "description": "Special member",
            },
            {
                "name": "Other Member",
                "code": "OTHER",
                "description": "Other member",
            },
        ]

        for category in categories:

            MemberCategory.objects.get_or_create(
                code=category["code"],
                defaults={
                    "name": category["name"],
                    "description": category["description"],
                },
            )

        MemberConfiguration.objects.get_or_create(
            pk=1,
            defaults={
                "show_next_of_kin": True,
                "show_vehicle": True,
                "show_guarantor": True,
                "show_kra_pin": True,
                "require_phone": True,
                "require_national_id": True,
                "require_passport_photo": False,
                "require_vehicle": False,
                "require_next_of_kin": False,
            },
        )

        default_fields = [
            (
                "first_name",
                "First Name",
                True,
                True,
            ),
            (
                "other_names",
                "Other Names",
                True,
                True,
            ),
            (
                "national_id",
                "National ID",
                True,
                True,
            ),
            (
                "phone_number",
                "Phone Number",
                True,
                True,
            ),
            (
                "kra_pin",
                "KRA PIN",
                True,
                False,
            ),
            (
                "occupation",
                "Occupation",
                True,
                False,
            ),
            (
                "passport_photo",
                "Passport Photo",
                True,
                False,
            ),
            (
                "vehicle",
                "Vehicle",
                True,
                False,
            ),
            (
                "next_of_kin",
                "Next Of Kin",
                True,
                False,
            ),
        ]

        for category in MemberCategory.objects.all():

            for order, field in enumerate(
                default_fields,
                start=1,
            ):

                (
                    field_name,
                    display_name,
                    is_visible,
                    is_required,
                ) = field

                FieldConfiguration.objects.get_or_create(
                    category=category,
                    field_name=field_name,
                    defaults={
                        "display_name": display_name,
                        "is_visible": is_visible,
                        "is_required": is_required,
                        "is_enabled": True,
                        "display_order": order,
                    },
                )

        self.stdout.write(
            self.style.SUCCESS(
                "Member seed completed successfully."
            )
        )