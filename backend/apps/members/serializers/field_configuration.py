from rest_framework import serializers

from ..models import FieldConfiguration


class FieldConfigurationSerializer(serializers.ModelSerializer):
    """
    Serializer for configurable member fields.
    """

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    class Meta:
        model = FieldConfiguration
        fields = (
            "id",
            "category",
            "category_name",
            "field_name",
            "display_name",
            "is_visible",
            "is_required",
            "is_enabled",
            "display_order",
        )

        read_only_fields = (
            "id",
            "category_name",
        )