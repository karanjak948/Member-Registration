from rest_framework import serializers
from apps.members.models.sms_log import SMSLog


class SMSLogSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source="get_event_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    member_membership_number = serializers.CharField(
        source="member.membership_number", read_only=True, default=""
    )

    class Meta:
        model = SMSLog
        fields = [
            "id",
            "member",
            "member_membership_number",
            "recipient_name",
            "phone_number",
            "message",
            "event_type",
            "event_type_display",
            "status",
            "status_display",
            "error_message",
            "gateway_response",
            "created_at",
        ]
        read_only_fields = fields
