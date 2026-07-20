from django.contrib.auth.password_validation import (
    validate_password,
)
from rest_framework import serializers

from .models import User


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(
        required=True
    )

    password = serializers.CharField(
        write_only=True,
        required=True,
    )


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for viewing and updating the
    authenticated user's profile.
    """

    profile_photo = serializers.ImageField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "profile_photo",
            "is_staff",
            "is_superuser",
        ]

        read_only_fields = [
            "id",
            "username",
            "is_staff",
            "is_superuser",
        ]


class ChangePasswordSerializer(
    serializers.Serializer
):
    """
    Validates a password-change request.
    """

    current_password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )

    new_password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )

    def validate_current_password(
        self,
        value,
    ):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "Current password is incorrect."
            )

        return value

    def validate(self, attrs):
        new_password = attrs["new_password"]

        confirm_password = attrs[
            "confirm_password"
        ]

        if new_password != confirm_password:
            raise serializers.ValidationError(
                {
                    "confirm_password":
                        "New passwords do not match."
                }
            )

        user = self.context["request"].user

        if user.check_password(new_password):
            raise serializers.ValidationError(
                {
                    "new_password":
                        "New password must be different "
                        "from the current password."
                }
            )

        validate_password(
            new_password,
            user=user,
        )

        return attrs