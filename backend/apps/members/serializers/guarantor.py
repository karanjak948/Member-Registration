from rest_framework import serializers

from ..models import Guarantor


class GuarantorSerializer(serializers.ModelSerializer):
    """
    Serializer for guarantors.
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