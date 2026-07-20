from rest_framework import serializers

from ..models import Member


class MemberSerializer(serializers.ModelSerializer):
    """
    Serializer for members.
    """

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
            "created_by_username",
            "created_at",
            "updated_at",
        )