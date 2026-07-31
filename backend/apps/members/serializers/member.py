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

    updated_by_username = serializers.CharField(
        source="updated_by.username",
        read_only=True,
    )

    approved_by_username = serializers.CharField(
        source="approved_by.username",
        read_only=True,
    )

    rejected_by_username = serializers.CharField(
        source="rejected_by.username",
        read_only=True,
    )

    activated_by_username = serializers.CharField(
        source="activated_by.username",
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

            "updated_by",
            "updated_by_username",

            "approved_by",
            "approved_by_username",
            "approved_at",

            "rejected_by",
            "rejected_by_username",
            "rejected_at",

            "activated_by",
            "activated_by_username",
            "activated_at",

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

            "updated_by",
            "updated_by_username",

            # Workflow audit fields are set exclusively by
            # the backend during workflow actions.
            "approved_by",
            "approved_by_username",
            "approved_at",

            "rejected_by",
            "rejected_by_username",
            "rejected_at",

            "activated_by",
            "activated_by_username",
            "activated_at",

            # These fields may only be changed through the
            # dedicated RBAC-protected workflow actions.
            "status",
            "registration_stage",

            "created_at",
            "updated_at",
        )