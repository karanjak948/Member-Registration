from django.db import models

from .member import Member


class Vehicle(models.Model):
    """
    Stores vehicles belonging to members.
    """

    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name="vehicles",
        db_index=True,
    )

    registration_number = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
    )

    make = models.CharField(
        max_length=100,
        blank=True,
    )

    model = models.CharField(
        max_length=100,
        blank=True,
    )

    year = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    color = models.CharField(
        max_length=50,
        blank=True,
    )

    engine_number = models.CharField(
        max_length=100,
        blank=True,
    )

    chassis_number = models.CharField(
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
        db_table = "tbl_vehicles"
        ordering = [
            "registration_number",
        ]

    def __str__(self):
        return (
            f"{self.registration_number}"
            f" ({self.member.membership_number})"
        )