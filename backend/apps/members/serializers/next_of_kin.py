from rest_framework import serializers

from ..models import NextOfKin


class NextOfKinSerializer(serializers.ModelSerializer):
    """
    Serializer for Next of Kin with ownership validation.
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

    def validate_member(self, member):
        request = self.context.get("request")

        if (
            request is None
            or not request.user.is_authenticated
        ):
            raise serializers.ValidationError(
                "Authentication is required."
            )

        if member.created_by_id != request.user.id:
            raise serializers.ValidationError(
                "The selected member does not "
                "belong to your account."
            )

        return member