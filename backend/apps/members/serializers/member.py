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

    category_code = serializers.CharField(
        source="category.code",
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

    full_name = serializers.SerializerMethodField()

    created_at_display = serializers.SerializerMethodField()

    updated_at_display = serializers.SerializerMethodField()

    approved_at_display = serializers.SerializerMethodField()

    rejected_at_display = serializers.SerializerMethodField()

    activated_at_display = serializers.SerializerMethodField()

    class Meta:
        model = Member

        fields = (
            "id",
            "membership_number",

            "organization",
            "organization_name",

            "category",
            "category_name",
            "category_code",

            "first_name",
            "other_names",
            "full_name",

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
            "created_at_display",

            "updated_at",
            "updated_at_display",

            "approved_at_display",

            "rejected_at_display",

            "activated_at_display",
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

            # Display fields are derived from the model.
            "full_name",

            "created_at_display",
            "updated_at_display",
            "approved_at_display",
            "rejected_at_display",
            "activated_at_display",
        )

    def get_full_name(self, obj):
        """
        Return the member's full name.
        """
        return f"{obj.first_name} {obj.other_names}".strip()

    def get_created_at_display(self, obj):
        """
        Return a formatted creation date string.
        """
        if obj.created_at:
            return obj.created_at.strftime(
                "%d %b %Y %I:%M %p"
            )
        return None

    def get_updated_at_display(self, obj):
        """
        Return a formatted last update date string.
        """
        if obj.updated_at:
            return obj.updated_at.strftime(
                "%d %b %Y %I:%M %p"
            )
        return None

    def get_approved_at_display(self, obj):
        """
        Return a formatted approval date string.
        """
        if obj.approved_at:
            return obj.approved_at.strftime(
                "%d %b %Y %I:%M %p"
            )
        return None

    def get_rejected_at_display(self, obj):
        """
        Return a formatted rejection date string.
        """
        if obj.rejected_at:
            return obj.rejected_at.strftime(
                "%d %b %Y %I:%M %p"
            )
        return None

    def get_activated_at_display(self, obj):
        """
        Return a formatted activation date string.
        """
        if obj.activated_at:
            return obj.activated_at.strftime(
                "%d %b %Y %I:%M %p"
            )
        return None