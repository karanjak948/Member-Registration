from django.core.exceptions import ValidationError
from django.db import models


class NextOfKin(models.Model):
    """
    Stores member next of kin information.
    """

    member = models.ForeignKey(
        "Member",
        on_delete=models.CASCADE,
        related_name="next_of_kin",
    )

    first_name = models.CharField(
        max_length=100,
    )

    other_names = models.CharField(
        max_length=150,
    )

    relationship = models.CharField(
        max_length=100,
    )

    national_id = models.CharField(
        max_length=30,
        blank=True,
        db_index=True,
    )

    phone_number = models.CharField(
        max_length=20,
        db_index=True,
    )

    physical_address = models.TextField(
        blank=True,
    )

    is_primary = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "tbl_next_of_kin"
        ordering = [
            "first_name",
            "other_names",
        ]

    def clean(self):
        """
        Ensure only one primary Next of Kin exists per member.
        """
        if self.is_primary:
            exists = (
                NextOfKin.objects.filter(
                    member=self.member,
                    is_primary=True,
                )
                .exclude(pk=self.pk)
                .exists()
            )

            if exists:
                raise ValidationError(
                    "Only one primary Next of Kin is allowed."
                )

    def __str__(self):
        return (
            f"{self.first_name} "
            f"{self.other_names}"
        )