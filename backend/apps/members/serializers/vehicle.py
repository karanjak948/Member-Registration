from rest_framework import serializers

from ..models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    """
    Serializer for vehicles.
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