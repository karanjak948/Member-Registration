from django.conf import settings
from django.db import models

from .member import Member


class MemberWorkflowHistory(models.Model):
    """
    Stores member workflow transitions.
    """

    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name="workflow_history",
        db_index=True,
    )

    previous_stage = models.CharField(
        max_length=50,
        blank=True,
    )

    current_stage = models.CharField(
        max_length=50,
        db_index=True,
    )

    remarks = models.TextField(
        blank=True,
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
    )

    changed_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "tbl_member_workflow_history"

        ordering = [
            "-changed_at",
        ]

    def __str__(self):
        return (
            f"{self.member.membership_number}"
            f" - {self.current_stage}"
        )