from django.db import models

from .member import Member


class Guarantor(models.Model):
    """
    Stores guarantor or recruiter information.
    """

    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name="guarantors",
        db_index=True,
    )

    guarantor_member = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        related_name="guaranteed_members",
        null=True,
        blank=True,
    )

    first_name = models.CharField(
        max_length=100,
    )

    other_names = models.CharField(
        max_length=150,
    )

    phone_number = models.CharField(
        max_length=20,
        db_index=True,
    )

    national_id = models.CharField(
        max_length=30,
        blank=True,
        db_index=True,
    )

    relationship = models.CharField(
        max_length=100,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "tbl_guarantors"
        ordering = [
            "first_name",
            "other_names",
        ]

    def __str__(self):
        return (
            f"{self.first_name} "
            f"{self.other_names}"
        )