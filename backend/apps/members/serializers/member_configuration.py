from rest_framework import serializers

from ..models import MemberConfiguration


class MemberConfigurationSerializer(serializers.ModelSerializer):
    """
    Global member configuration serializer.
    """

    class Meta:
        model = MemberConfiguration
        fields = "__all__"

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )