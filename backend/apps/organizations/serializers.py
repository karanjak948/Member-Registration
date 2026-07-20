from rest_framework import serializers

from .models import Organization


class OrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer for the singleton Organization model.
    Used for retrieving and updating the organization profile.
    """

    class Meta:
        model = Organization

        fields = (
            "id",
            "name",
            "code",
            "email",
            "phone_number",
            "physical_address",
            "website",
            "logo",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Organization name is required."
            )

        return value

    def validate_code(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Organization code is required."
            )

        return value

    def validate_email(self, value):
        return value.lower().strip()

    def validate_phone_number(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Phone number is required."
            )

        return value

    def validate(self, attrs):
        """
        Place for future cross-field validation.
        """
        return attrs