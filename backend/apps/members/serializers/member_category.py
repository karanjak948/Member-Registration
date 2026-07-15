from rest_framework import serializers

from ..models import MemberCategory


class MemberCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for member categories.
    """

    class Meta:
        model = MemberCategory
        fields = (
            "id",
            "name",
            "code",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )