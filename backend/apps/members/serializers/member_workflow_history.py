from rest_framework import serializers

from ..models import MemberWorkflowHistory


class MemberWorkflowHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for workflow history.
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
        model = MemberWorkflowHistory

        fields = "__all__"

        read_only_fields = (
            "id",
            "changed_at",
            "member_number",
            "changed_by_username",
        )