from rest_framework import serializers

from ..models import MemberAudit


class MemberAuditSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for audit logs.
    """

    member_number = serializers.CharField(
        source="member.membership_number",
        read_only=True,
    )

    changed_by_username = serializers.CharField(
        source="changed_by.username",
        read_only=True,
    )

    class Meta:
        model = MemberAudit

        fields = "__all__"

        read_only_fields = "__all__"