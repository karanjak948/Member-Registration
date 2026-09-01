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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.guarantor_member:
            g_mem = instance.guarantor_member
            data["guarantor_member_name"] = f"{g_mem.first_name} {g_mem.other_names}".strip()
            data["guarantor_member_phone"] = g_mem.phone_number
            data["guarantor_member_national_id"] = g_mem.national_id
            if not data.get("first_name"):
                data["first_name"] = g_mem.first_name
            if not data.get("other_names"):
                data["other_names"] = g_mem.other_names
            if not data.get("phone_number"):
                data["phone_number"] = g_mem.phone_number
            if not data.get("national_id"):
                data["national_id"] = g_mem.national_id
        return data

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