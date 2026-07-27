from django.contrib.auth.password_validation import (
    validate_password,
)
from rest_framework import serializers

from .models import User
from apps.organizations.models import OrganizationUser


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(
        required=True
    )

    password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
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


class CurrentUserSerializer(serializers.ModelSerializer):
    """
    Read serializer for the authenticated user's complete
    application identity and authorization context.

    This exposes:
    - User profile information
    - Organization
    - Assigned role
    - Effective permission codes

    Authorization remains enforced by the backend.
    The frontend may use this information only to control
    navigation and user-interface visibility.
    """

    organization = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

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
            "organization",
            "role",
            "permissions",
        ]

        read_only_fields = fields

    def get_membership(self, obj):
        """
        Resolve the user's active organization membership.

        The current data model permits memberships through
        OrganizationUser. The first active membership is used
        because the application currently operates with one
        active organization context per user.
        """

        if hasattr(self, "_membership_cache"):
            return self._membership_cache

        membership = (
            OrganizationUser.objects
            .select_related(
                "organization",
                "role",
            )
            .prefetch_related(
                "role__permissions",
            )
            .filter(
                user=obj,
                is_active=True,
            )
            .first()
        )

        self._membership_cache = membership

        return membership

    def get_organization(self, obj):
        membership = self.get_membership(obj)

        if membership is None:
            return None

        organization = membership.organization

        return {
            "id": organization.id,
            "name": organization.name,
            "code": organization.code,
        }

    def get_role(self, obj):
        membership = self.get_membership(obj)

        if membership is None:
            return None

        role = membership.role

        return {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "is_system_role": role.is_system_role,
        }

    def get_permissions(self, obj):
        membership = self.get_membership(obj)

        if membership is None:
            return []

        return sorted(
            membership.role.permissions.values_list(
                "code",
                flat=True,
            )
        )


class RegisterSerializer(serializers.ModelSerializer):
    """
    Safely creates a standard application user.

    Staff/superuser privileges cannot be assigned
    through the public registration endpoint.
    """

    password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "confirm_password",
        ]

        read_only_fields = [
            "id",
        ]

    def validate_username(
        self,
        value,
    ):
        value = value.strip()

        if User.objects.filter(
            username__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "A user with this username "
                "already exists."
            )

        return value

    def validate_email(
        self,
        value,
    ):
        value = value.strip().lower()

        if User.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "A user with this email "
                "already exists."
            )

        return value

    def validate(self, attrs):
        password = attrs["password"]

        confirm_password = attrs[
            "confirm_password"
        ]

        if password != confirm_password:
            raise serializers.ValidationError(
                {
                    "confirm_password":
                        "Passwords do not match."
                }
            )

        temporary_user = User(
            username=attrs.get(
                "username",
                "",
            ),
            email=attrs.get(
                "email",
                "",
            ),
            first_name=attrs.get(
                "first_name",
                "",
            ),
            last_name=attrs.get(
                "last_name",
                "",
            ),
        )

        validate_password(
            password,
            user=temporary_user,
        )

        return attrs

    def create(self, validated_data):
        validated_data.pop(
            "confirm_password"
        )

        password = validated_data.pop(
            "password"
        )

        user = User(
            **validated_data
        )

        # Public registration must never grant
        # privileged application access.
        user.is_staff = False
        user.is_superuser = False

        user.set_password(
            password
        )

        user.save()

        return user


class ChangePasswordSerializer(
    serializers.Serializer
):
    """
    Changes the password for an already
    authenticated user.

    This flow is intentionally separate from
    forgotten-password recovery.
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
        new_password = attrs[
            "new_password"
        ]

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

        user = self.context[
            "request"
        ].user

        if user.check_password(
            new_password
        ):
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


class ForgotPasswordSerializer(
    serializers.Serializer
):
    """
    Stage 1 of password recovery.

    Accepts the account email address used to
    request a six-digit verification code.

    Account existence is deliberately not checked
    here because the public endpoint must return
    the same outward response for known and
    unknown email addresses.
    """

    email = serializers.EmailField(
        required=True
    )

    def validate_email(
        self,
        value,
    ):
        return (
            value
            .strip()
            .lower()
        )


class VerifyResetOTPSerializer(
    serializers.Serializer
):
    """
    Stage 2 of password recovery.

    Accepts the email address and six-digit OTP.

    Actual OTP hash verification, expiry,
    attempt limiting and one-time consumption
    are performed by the view/service layer.
    """

    email = serializers.EmailField(
        required=True
    )

    otp = serializers.CharField(
        required=True,
        min_length=6,
        max_length=6,
        trim_whitespace=True,
    )

    def validate_email(
        self,
        value,
    ):
        return (
            value
            .strip()
            .lower()
        )

    def validate_otp(
        self,
        value,
    ):
        value = value.strip()

        if not value.isdigit():
            raise serializers.ValidationError(
                "Verification code must contain "
                "exactly 6 digits."
            )

        if len(value) != 6:
            raise serializers.ValidationError(
                "Verification code must contain "
                "exactly 6 digits."
            )

        return value


class ResetPasswordSerializer(
    serializers.Serializer
):
    """
    Stage 3 of password recovery.

    The client may reset a password only after
    successfully verifying the OTP and receiving
    a short-lived signed reset authorization token.

    The reset token is validated by the
    view/service layer before the password is saved.
    """

    reset_token = serializers.CharField(
        required=True,
        write_only=True,
        trim_whitespace=True,
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

    def validate(self, attrs):
        new_password = attrs[
            "new_password"
        ]

        confirm_password = attrs[
            "confirm_password"
        ]

        if (
            new_password
            != confirm_password
        ):
            raise serializers.ValidationError(
                {
                    "confirm_password":
                        "Passwords do not match."
                }
            )

        return attrs