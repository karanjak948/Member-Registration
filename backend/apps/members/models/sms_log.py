from django.db import models
from apps.common.sms_constants import SMSEventType, SMSDeliveryStatus


class SMSLog(models.Model):
    """
    Audit log of all SMS notifications dispatched across Royal SACCO.
    """
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sms_logs",
    )
    recipient_name = models.CharField(max_length=150, blank=True, default="")
    phone_number = models.CharField(max_length=30, db_index=True)
    message = models.TextField()
    event_type = models.CharField(
        max_length=50,
        choices=SMSEventType.choices,
        default=SMSEventType.BULK_BROADCAST,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=SMSDeliveryStatus.choices,
        default=SMSDeliveryStatus.SENT,
        db_index=True,
    )
    error_message = models.TextField(blank=True, null=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "tbl_sms_logs"
        ordering = ["-created_at"]
        verbose_name = "SMS Delivery Log"
        verbose_name_plural = "SMS Delivery Logs"

    def __str__(self):
        return f"[{self.get_event_type_display()}] {self.phone_number} - {self.get_status_display()} ({self.created_at:%Y-%m-%d %H:%M})"
