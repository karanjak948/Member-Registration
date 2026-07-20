from rest_framework import serializers

from ..models import NextOfKin


class NextOfKinSerializer(serializers.ModelSerializer):
    """
    Serializer for member next of kin.
    """

    member_number = serializers.CharField(
        source="member.membership_number",
        read_only=True,
    )

    class Meta:
        model = NextOfKin

        fields = "__all__"

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "member_number",
        )