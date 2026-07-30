from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from apps.members.models import (
    FieldConfiguration,
    MemberCategory,
    MemberConfiguration,
)
from apps.organizations.models import Permission


User = get_user_model()


class Command(BaseCommand):
    help = (
        "Seed default member categories, "
        "member configuration, field configuration, "
        "and member permissions."
    )

    def handle(self, *args, **options):

        # ============================================================
        # MEMBER CATEGORIES
        # ============================================================

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

        # ============================================================
        # MEMBER CONFIGURATION
        # ============================================================

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

        # ============================================================
        # FIELD CONFIGURATION
        # ============================================================

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

        # ============================================================
        # MEMBER PERMISSIONS
        # ============================================================

        member_permissions = [
            {
                "code": "view_members",
                "name": "View Members",
                "module": "members",
                "description": "Can view member profiles and details",
            },
            {
                "code": "create_members",
                "name": "Create Members",
                "module": "members",
                "description": "Can create new members",
            },
            {
                "code": "edit_members",
                "name": "Edit Members",
                "module": "members",
                "description": "Can edit member profiles",
            },
            {
                "code": "delete_members",
                "name": "Delete Members",
                "module": "members",
                "description": "Can delete member records",
            },
            {
                "code": "approve_members",
                "name": "Approve Members",
                "module": "members",
                "description": "Can approve member registrations",
            },
            {
                "code": "reject_members",  # ✅ Present
                "name": "Reject Members",
                "module": "members",
                "description": "Can reject member registrations",
            },
            {
                "code": "activate_members",
                "name": "Activate Members",
                "module": "members",
                "description": "Can activate member accounts",
            },
            {
                "code": "deactivate_members",
                "name": "Deactivate Members",
                "module": "members",
                "description": "Can deactivate member accounts",
            },
            {
                "code": "complete_registration_members",  # ✅ Present
                "name": "Complete Registration",
                "module": "members",
                "description": "Can complete member registration (APPROVED → ACTIVE)",
            },
        ]

        for permission_data in member_permissions:
            Permission.objects.get_or_create(
                code=permission_data["code"],
                defaults={
                    "name": permission_data["name"],
                    "module": permission_data["module"],
                    "description": permission_data["description"],
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Member seed completed successfully."
            )
        )