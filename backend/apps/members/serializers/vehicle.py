from rest_framework import serializers

from ..models import Vehicle
from apps.organizations.models import OrganizationUser


class VehicleSerializer(serializers.ModelSerializer):
    """
    Serializer for vehicles with ownership validation.
    """

    member_number = serializers.CharField(
        source="member.membership_number",
        read_only=True,
    )

    class Meta:
        model = Vehicle

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

        membership = (
            OrganizationUser.objects.filter(
                user=request.user,
                is_active=True,
            )
            .select_related("organization")
            .first()
        )

        if membership is None:
            raise serializers.ValidationError(
                "You do not belong to an organization."
            )

        if member.organization_id != membership.organization_id:
            raise serializers.ValidationError(
                "The selected member does not belong to your organization."
            )

        return member