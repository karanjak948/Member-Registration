from rest_framework import serializers

from .models import Organization


class OrganizationSerializer(
    serializers.ModelSerializer
):
    """
    Serializer for a user-owned organization/workspace.

    Ownership is assigned exclusively by the backend and
    cannot be supplied or changed by API clients.
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
            "logo",
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

        queryset = Organization.objects.filter(
            code__iexact=value
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "This organization code is already in use."
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
        Ownership is intentionally absent from writable
        serializer fields and is assigned server-side.
        """
        return attrs