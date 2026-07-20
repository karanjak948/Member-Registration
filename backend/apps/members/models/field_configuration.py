from django.db import models

from .member_category import MemberCategory


class FieldConfiguration(models.Model):
    """
    Controls visibility and validation of member fields.
    """

    category = models.ForeignKey(
        MemberCategory,
        on_delete=models.CASCADE,
        related_name="field_configurations",
    )

    field_name = models.CharField(
        max_length=100,
    )

    display_name = models.CharField(
        max_length=150,
    )

    is_visible = models.BooleanField(
        default=True,
    )

    is_required = models.BooleanField(
        default=False,
    )

    is_enabled = models.BooleanField(
        default=True,
    )

    display_order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        db_table = "tbl_field_configuration"

        ordering = [
            "category",
            "display_order",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "category",
                    "field_name",
                ],
                name="unique_category_field",
            )
        ]

    def __str__(self):
        return (
            f"{self.category.name} - "
            f"{self.display_name}"
        )