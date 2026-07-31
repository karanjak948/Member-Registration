from rest_framework import serializers

from ..models import Guarantor
from apps.organizations.models import OrganizationUser


class GuarantorSerializer(serializers.ModelSerializer):
    """
    Serializer for guarantors with ownership validation.
    """

    member_number = serializers.CharField(
        source="member.membership_number",
        read_only=True,
    )

    guarantor_number = serializers.CharField(
        source="guarantor_member.membership_number",
        read_only=True,
    )

    class Meta:
        model = Guarantor

        fields = "__all__"

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "member_number",
            "guarantor_number",
        )

    def _validate_owned_member(
        self,
        member,
        field_name,
    ):
        if member is None:
            return member

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
                f"The selected {field_name} does not belong to your organization."
            )

        return member

    def validate_member(self, member):
        return self._validate_owned_member(
            member,
            "member",
        )

    def validate_guarantor_member(
        self,
        guarantor_member,
    ):
        return self._validate_owned_member(
            guarantor_member,
            "guarantor member",
        )