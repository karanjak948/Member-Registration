from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import (
    validate_password,
)
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction

from rest_framework import serializers

from .models import (
    Organization,
    OrganizationUser,
    Permission,
    Role,
)

User = get_user_model()


# ============================================================
# ORGANIZATION
# ============================================================

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

        # 🔥 FIXED: Correctly handle empty or null instances for the frontend flow
        if self.instance and self.instance.id:
            queryset = Organization.objects.filter(
                code__iexact=value
            ).exclude(
                pk=self.instance.pk
            )
        else:
            queryset = Organization.objects.filter(
                code__iexact=value
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


# ============================================================
# PERMISSIONS
# ============================================================

class PermissionSerializer(
    serializers.ModelSerializer
):
    """
    Read-only representation of an application permission.
    """

    class Meta:
        model = Permission

        fields = (
            "id",
            "code",
            "name",
            "module",
            "description",
        )

        read_only_fields = fields


# ============================================================
# ROLES
# ============================================================

class RoleSerializer(
    serializers.ModelSerializer
):
    """
    Full serializer used for role management.

    Roles belong to the authenticated user's organization.

    Clients submit permission_ids when creating or updating
    a role. The expanded permissions are returned for reads.
    """

    permissions = PermissionSerializer(
        many=True,
        read_only=True,
    )

    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="permissions",
    )

    class Meta:
        model = Role

        fields = (
            "id",
            "name",
            "description",
            "is_system_role",
            "permissions",
            "permission_ids",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "is_system_role",
            "created_at",
            "updated_at",
        )

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Role name is required."
            )

        request = self.context.get("request")

        if request is None:
            return value

        organization = getattr(
            request.user,
            "organization",
            None,
        )

        # A non-owner organization user may not have
        # request.user.organization because that relation
        # represents ownership only. Fall back to the
        # organization supplied by the view when available.
        organization = self.context.get(
            "organization",
            organization,
        )

        if organization is None:
            return value

        queryset = Role.objects.filter(
            organization=organization,
            name__iexact=value,
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "A role with this name already exists "
                "in this organization."
            )

        return value

    def create(self, validated_data):
        permissions = validated_data.pop(
            "permissions",
            [],
        )

        organization = self.context.get(
            "organization"
        )

        if organization is None:
            raise serializers.ValidationError(
                {
                    "organization": (
                        "Organization context is required "
                        "to create a role."
                    )
                }
            )

        role = Role.objects.create(
            organization=organization,
            **validated_data,
        )

        role.permissions.set(
            permissions
        )

        return role

    def update(self, instance, validated_data):
        permissions = validated_data.pop(
            "permissions",
            None,
        )

        # System roles may be protected by the view.
        # The serializer never allows clients to alter
        # is_system_role directly.

        instance.name = validated_data.get(
            "name",
            instance.name,
        )

        instance.description = validated_data.get(
            "description",
            instance.description,
        )

        instance.save()

        if permissions is not None:
            instance.permissions.set(
                permissions
            )

        return instance


class RoleSummarySerializer(
    serializers.ModelSerializer
):
    """
    Compact role representation nested inside users.
    """

    class Meta:
        model = Role

        fields = (
            "id",
            "name",
            "description",
            "is_system_role",
        )

        read_only_fields = fields


# ============================================================
# ORGANIZATION USERS — READ
# ============================================================

class OrganizationUserSerializer(
    serializers.ModelSerializer
):
    """
    Read representation of a user belonging to an
    organization.

    Authentication identity comes from User while
    authorization comes from the assigned Role.
    """

    user_id = serializers.IntegerField(
        source="user.id",
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    role = RoleSummarySerializer(
        read_only=True,
    )

    permissions = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationUser

        fields = (
            "id",
            "user_id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "permissions",
            "is_active",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields

    def get_permissions(self, obj):
        permissions = (
            obj.role.permissions
            .all()
            .order_by("name")
        )

        return PermissionSerializer(
            permissions,
            many=True,
        ).data


# ============================================================
# ORGANIZATION USERS — CREATE
# ============================================================

class OrganizationUserCreateSerializer(
    serializers.Serializer
):
    """
    Creates a standard application user and assigns that
    user to the current organization with one role.

    User creation and membership creation occur in a single
    transaction so partial records cannot remain behind.
    """

    username = serializers.CharField(
        max_length=150,
    )

    email = serializers.EmailField()

    first_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    role_id = serializers.IntegerField(
        write_only=True,
    )

    def validate_username(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Username is required."
            )

        if User.objects.filter(
            username__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "A user with this username already exists."
            )

        return value

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value

    def validate(self, attrs):
        organization = self.context[
            "organization"
        ]

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

        role = (
            Role.objects
            .filter(
                pk=attrs["role_id"],
                organization=organization,
            )
            .first()
        )

        if role is None:
            raise serializers.ValidationError(
                {
                    "role_id": (
                        "The selected role does not belong "
                        "to this organization."
                    )
                }
            )

        temporary_user = User(
            username=attrs["username"],
            email=attrs["email"],
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

        attrs["role"] = role

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        organization = self.context[
            "organization"
        ]

        role = validated_data.pop(
            "role"
        )

        validated_data.pop(
            "role_id"
        )

        validated_data.pop(
            "confirm_password"
        )

        password = validated_data.pop(
            "password"
        )

        user = User(
            organization=organization,
            **validated_data
        )

        # Ensure organization staff members have staff access enabled
        user.is_staff = True
        user.is_superuser = False

        user.set_password(
            password
        )

        user.save()

        membership = (
            OrganizationUser.objects.create(
                organization=organization,
                user=user,
                role=role,
                is_active=True,
            )
        )

        return membership


# ============================================================
# ORGANIZATION USERS — UPDATE
# ============================================================

class OrganizationUserUpdateSerializer(
    serializers.Serializer
):
    """
    Updates account details, assigned role, and organization
    membership status.

    Username and Django privilege flags are deliberately
    excluded from this endpoint.
    """

    first_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    email = serializers.EmailField(
        required=False,
    )

    role_id = serializers.IntegerField(
        required=False,
        write_only=True,
    )

    is_active = serializers.BooleanField(
        required=False,
    )

    password = serializers.CharField(
        max_length=128,
        required=False,
        write_only=True,
        min_length=6,
    )

    def validate_password(self, value):
        if value:
            try:
                validate_password(value, user=self.instance.user)
            except DjangoValidationError as exc:
                raise serializers.ValidationError(list(exc.messages))
        return value

    def validate_email(self, value):
        value = value.strip().lower()

        user = self.instance.user

        if (
            User.objects
            .filter(
                email__iexact=value
            )
            .exclude(
                pk=user.pk
            )
            .exists()
        ):
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value

    def validate_role_id(self, value):
        organization = (
            self.instance.organization
        )

        role = (
            Role.objects
            .filter(
                pk=value,
                organization=organization,
            )
            .first()
        )

        if role is None:
            raise serializers.ValidationError(
                "The selected role does not belong to "
                "this organization."
            )

        return value

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):
        role_id = validated_data.pop(
            "role_id",
            None,
        )

        password = validated_data.pop(
            "password",
            None,
        )

        user = instance.user

        user_fields = []

        for field in (
            "first_name",
            "last_name",
            "email",
        ):
            if field in validated_data:
                setattr(
                    user,
                    field,
                    validated_data[field],
                )

                user_fields.append(
                    field
                )

        if password:
            user.set_password(password)
            user_fields.append("password")

        if "is_active" in validated_data:
            instance.is_active = (
                validated_data[
                    "is_active"
                ]
            )
            user.is_active = instance.is_active
            if "is_active" not in user_fields:
                user_fields.append("is_active")

        if user_fields:
            if hasattr(user, "updated_at"):
                user_fields.append("updated_at")
            user.save(
                update_fields=user_fields
            )

        if role_id is not None:
            instance.role_id = role_id

        instance.save()

        return instance