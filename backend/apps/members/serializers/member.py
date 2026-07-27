from rest_framework import serializers

from ..models import Member


class MemberSerializer(serializers.ModelSerializer):
    """
    Serializer for organization-scoped member records.

    Organization, ownership, membership identity, status,
    and workflow state are controlled exclusively by the
    backend and cannot be assigned directly by API clients.
    """

    organization_name = serializers.CharField(
        source="organization.name",
        read_only=True,
    )

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = Member

        fields = (
            "id",
            "membership_number",

            "organization",
            "organization_name",

            "category",
            "category_name",

            "first_name",
            "other_names",
            "national_id",
            "phone_number",
            "email",
            "physical_address",
            "occupation",
            "passport_photo",
            "kra_pin",

            "status",
            "registration_stage",

            "created_by",
            "created_by_username",

            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "membership_number",

            # Tenant isolation is controlled by the backend.
            # Clients must never choose or change the
            # organization of a member.
            "organization",
            "organization_name",

            # Record authorship is assigned server-side.
            "created_by",
            "created_by_username",

            # These fields may only be changed through the
            # dedicated RBAC-protected workflow actions.
            "status",
            "registration_stage",

            "created_at",
            "updated_at",
        )