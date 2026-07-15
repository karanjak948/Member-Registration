from django.conf import settings
from django.db import models

from .member import Member


class MemberAudit(models.Model):
    """
    Stores an audit trail for member records.
    """

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        CONVERT = "CONVERT", "Convert"
        APPROVE = "APPROVE", "Approve"
        REJECT = "REJECT", "Reject"

    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name="audit_logs",
        db_index=True,
    )

    action = models.CharField(
        max_length=20,
        choices=Action.choices,
        db_index=True,
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
    )

    old_data = models.JSONField(
        null=True,
        blank=True,
    )

    new_data = models.JSONField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "tbl_member_audit"
        ordering = [
            "-created_at",
        ]

    def __str__(self):
        return (
            f"{self.member.membership_number} - "
            f"{self.action}"
        )