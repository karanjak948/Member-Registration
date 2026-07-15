from django.conf import settings
from django.db import models
from django.db.models import Max


class Member(models.Model):
    """
    Core member profile.
    """

    class MemberStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        SUSPENDED = "SUSPENDED", "Suspended"

    class RegistrationStage(models.TextChoices):
        DATA_CAPTURE_PENDING = (
            "DATA_CAPTURE_PENDING",
            "Data Capture Pending",
        )
        REJECTED = "REJECTED", "Rejected"
        APPROVED = "APPROVED", "Approved"
        ACTIVE = "ACTIVE", "Active"

    membership_number = models.CharField(
        max_length=30,
        unique=True,
        editable=False,
        db_index=True,
    )

    first_name = models.CharField(
        max_length=100,
    )

    other_names = models.CharField(
        max_length=150,
    )

    national_id = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
    )

    phone_number = models.CharField(
        max_length=20,
        db_index=True,
    )

    email = models.EmailField(
        unique=True,
        blank=True,
        null=True,
    )

    physical_address = models.TextField(
        blank=True,
    )

    occupation = models.CharField(
        max_length=150,
        blank=True,
    )

    passport_photo = models.ImageField(
        upload_to="members/photos/",
        blank=True,
        null=True,
    )

    kra_pin = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        choices=MemberStatus.choices,
        default=MemberStatus.ACTIVE,
        db_index=True,
    )

    registration_stage = models.CharField(
        max_length=30,
        choices=RegistrationStage.choices,
        default=RegistrationStage.DATA_CAPTURE_PENDING,
        db_index=True,
    )

    category = models.ForeignKey(
        "MemberCategory",
        on_delete=models.PROTECT,
        related_name="members",
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="members_created",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "tbl_members"
        ordering = [
            "first_name",
            "other_names",
        ]

    def save(self, *args, **kwargs):
        """
        Automatically generate membership number.

        Format:
            RC-000001
            RC-000002
        """

        if not self.membership_number:
            last_member = (
                Member.objects.aggregate(
                    max_id=Max("id")
                )["max_id"]
                or 0
            )

            next_id = last_member + 1

            self.membership_number = (
                f"RC-{next_id:06d}"
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.membership_number} - "
            f"{self.first_name} {self.other_names}"
        )