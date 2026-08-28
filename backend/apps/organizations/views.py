from rest_framework import status
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models.deletion import ProtectedError
from django.contrib.auth import get_user_model

from rest_framework import (
    generics,
    status,
)

from .models import (
    Organization,
    OrganizationUser,
    Permission,
    Role,
)

from .permissions import (
    HasRBACPermission,
    IsOrganizationMember,
)

from .serializers import (
    OrganizationSerializer,
    OrganizationUserCreateSerializer,
    OrganizationUserSerializer,
    OrganizationUserUpdateSerializer,
    PermissionSerializer,
    RoleSerializer,
)

from .services import OrganizationAccessService

from rest_framework.exceptions import PermissionDenied

# Get the User model
User = get_user_model()


class OrganizationAPIView(APIView):
    """
    API for the authenticated user's organization.

    Each user can access and modify only their own
    organization/workspace.

    GET:
        Returns the user's organization if configured.
        Otherwise returns an empty organization template.

    PUT/PATCH:
        Updates the user's existing organization or creates
        one when configuring it for the first time.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_object(self, user):
        org = (
            Organization.objects
            .filter(owner=user)
            .first()
        )
        if not org:
            membership = (
                OrganizationUser.objects
                .filter(user=user)
                .select_related("organization")
                .first()
            )
            if membership:
                org = membership.organization
        if not org:
            org = Organization.objects.first()
        return org

    def get(self, request):
        organization = self.get_object(
            request.user
        )

        if organization is None:
            return Response(
                {
                    "id": None,
                    "name": "",
                    "code": "",
                    "email": request.user.email or "",
                    "phone_number": "",
                    "physical_address": "",
                    "website": "",
                    "logo": None,
                    "created_at": None,
                    "updated_at": None,
                    "is_configured": False,
                },
                status=status.HTTP_200_OK,
            )

        serializer = OrganizationSerializer(
            organization,
            context={
                "request": request,
            },
        )

        data = serializer.data
        data["is_configured"] = True

        return Response(
            data,
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        organization = self.get_object(
            request.user
        )

        serializer = OrganizationSerializer(
            organization,
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        if organization is None:
            organization = serializer.save(
                owner=request.user
            )
            OrganizationAccessService.bootstrap_organization(
                organization,
                request.user
            )

            response_status = (
                status.HTTP_201_CREATED
            )
        else:
            organization = serializer.save()
            OrganizationAccessService.bootstrap_organization(
                organization,
                request.user
            )

            response_status = status.HTTP_200_OK

        data = serializer.data
        data["is_configured"] = True

        return Response(
            data,
            status=response_status,
        )

    def patch(self, request):
        organization = self.get_object(
            request.user
        )

        serializer = OrganizationSerializer(
            organization,
            data=request.data,
            partial=organization is not None,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        if organization is None:
            organization = serializer.save(
                owner=request.user
            )
            OrganizationAccessService.bootstrap_organization(
                organization,
                request.user
            )

            response_status = (
                status.HTTP_201_CREATED
            )
        else:
            organization = serializer.save()
            OrganizationAccessService.bootstrap_organization(
                organization,
                request.user
            )

            response_status = status.HTTP_200_OK

        data = serializer.data
        data["is_configured"] = True

        return Response(
            data,
            status=response_status,
        )


class OrganizationLogoUploadView(APIView):
    """
    Upload, replace, or remove the authenticated user's
    organization logo.

    Logo operations are strictly scoped to the current
    user's organization.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    ALLOWED_CONTENT_TYPES = {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    }

    MAX_FILE_SIZE = 2 * 1024 * 1024

    def get_object(self, user):
        org = (
            Organization.objects
            .filter(owner=user)
            .first()
        )
        if not org:
            membership = (
                OrganizationUser.objects
                .filter(user=user)
                .select_related("organization")
                .first()
            )
            if membership:
                org = membership.organization
        if not org:
            org = Organization.objects.first()
        return org

    def patch(self, request):
        organization = self.get_object(
            request.user
        )

        if organization is None:
            return Response(
                {
                    "detail": (
                        "Configure your organization "
                        "before uploading a logo."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        logo_file = request.FILES.get("logo")

        if logo_file is None:
            return Response(
                {
                    "detail":
                        "No logo file provided."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            logo_file.content_type
            not in self.ALLOWED_CONTENT_TYPES
        ):
            return Response(
                {
                    "detail": (
                        "Invalid file type. "
                        "Please upload JPEG, PNG, "
                        "GIF, or WEBP."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if logo_file.size > self.MAX_FILE_SIZE:
            return Response(
                {
                    "detail":
                        "File size exceeds 2MB limit."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_logo_name = None
        if organization.logo:
            old_logo_name = organization.logo.name

        organization.logo = logo_file
        organization.save(
            update_fields=[
                "logo",
                "updated_at",
            ]
        )

        if old_logo_name and old_logo_name != organization.logo.name:
            try:
                from django.core.files.storage import default_storage
                if default_storage.exists(old_logo_name):
                    default_storage.delete(old_logo_name)
            except Exception:
                pass

        serializer = OrganizationSerializer(
            organization,
            context={
                "request": request,
            },
        )

        data = serializer.data
        data["is_configured"] = True

        return Response(
            data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        organization = self.get_object(
            request.user
        )

        if organization is None:
            return Response(
                {
                    "detail":
                        "Organization has not been configured."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not organization.logo:
            return Response(
                {
                    "detail":
                        "No logo found to remove."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        organization.logo.delete(
            save=False
        )

        organization.logo = None
        organization.save(
            update_fields=[
                "logo",
                "updated_at",
            ]
        )

        return Response(
            {
                "detail":
                    "Logo removed successfully."
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# PERMISSIONS
# ============================================================

class PermissionListAPIView(
    generics.ListAPIView
):
    """
    List the system permission catalogue.

    Any authenticated organization member may inspect the
    available permissions. Permission definitions themselves
    are system-controlled and cannot be modified here.
    """

    serializer_class = PermissionSerializer

    permission_classes = [
        IsAuthenticated,
        IsOrganizationMember,
    ]

    queryset = Permission.objects.all().order_by(
        "module",
        "name",
    )


# ============================================================
# ROLES
# ============================================================

class RoleListCreateAPIView(
    generics.ListCreateAPIView
):
    """
    List and create roles belonging exclusively to the
    authenticated user's organization.
    """

    serializer_class = RoleSerializer

    permission_classes = [
        IsAuthenticated,
        HasRBACPermission,
    ]

    required_permission = "manage_roles"

    def get_organization(self):
        return OrganizationAccessService.get_organization(
            self.request.user
        )

    def get_queryset(self):
        organization = self.get_organization()

        if organization is None:
            return Role.objects.none()

        return (
            Role.objects
            .filter(
                organization=organization
            )
            .prefetch_related(
                "permissions"
            )
            .order_by("name")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()

        context["organization"] = self.get_organization()

        return context


class RoleDetailAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    """
    Retrieve, update, or delete an organization role.

    System roles such as Owner are protected against
    modification and deletion.
    """

    serializer_class = RoleSerializer

    permission_classes = [
        IsAuthenticated,
        HasRBACPermission,
    ]

    required_permission = "manage_roles"

    def get_organization(self):
        return OrganizationAccessService.get_organization(
            self.request.user
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()

        context["organization"] = self.get_organization()

        return context

    def get_queryset(self):
        organization = self.get_organization()

        if organization is None:
            return Role.objects.none()

        return (
            Role.objects
            .filter(
                organization=organization
            )
            .prefetch_related(
                "permissions"
            )
        )

    def update(
        self,
        request,
        *args,
        **kwargs,
    ):
        role = self.get_object()

        if role.is_system_role:
            return Response(
                {
                    "detail": (
                        "System roles cannot be modified."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().update(
            request,
            *args,
            **kwargs,
        )

    def partial_update(
        self,
        request,
        *args,
        **kwargs,
    ):
        role = self.get_object()

        if role.is_system_role:
            return Response(
                {
                    "detail": (
                        "System roles cannot be modified."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().partial_update(
            request,
            *args,
            **kwargs,
        )

    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):
        role = self.get_object()

        if role.is_system_role:
            return Response(
                {
                    "detail": (
                        "System roles cannot be deleted."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            role.delete()

        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "This role cannot be deleted because "
                        "one or more users are assigned to it. "
                        "Reassign those users first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


# ============================================================
# ORGANIZATION USERS
# ============================================================

class OrganizationUserListCreateView(APIView):
    """
    List organization users or create a new user with an
    assigned organization role.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    def get_organization(self, user):
        organization = (
            OrganizationAccessService
            .get_organization(user)
        )

        if organization is None:
            raise PermissionDenied(
                "You do not belong to an organization."
            )

        return organization

    def check_manage_users(self, user):
        if not (
            OrganizationAccessService
            .has_permission(
                user,
                "manage_users",
            )
        ):
            raise PermissionDenied(
                "You do not have permission to manage users."
            )

    def get(self, request):
        self.check_manage_users(
            request.user
        )

        organization = self.get_organization(
            request.user
        )

        memberships = (
            OrganizationUser.objects
            .filter(
                organization=organization
            )
            .select_related(
                "user",
                "role",
            )
            .prefetch_related(
                "role__permissions"
            )
            .order_by(
                "user__username"
            )
        )

        serializer = OrganizationUserSerializer(
            memberships,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        self.check_manage_users(
            request.user
        )

        organization = self.get_organization(
            request.user
        )

        # ===================== UPDATED LOGIC =====================
        # If the request matches an existing user (by username or email),
        # assign them directly to the organization without requiring a new account.
        username = (request.data.get('username') or '').strip()
        email = (request.data.get('email') or '').strip()
        role_id = request.data.get('role_id')

        existing_user = None
        if username:
            existing_user = User.objects.filter(username__iexact=username).first()
        if not existing_user and email:
            existing_user = User.objects.filter(email__iexact=email).first()

        if existing_user:
            # Check if they are already a member of the organization
            if OrganizationUser.objects.filter(organization=organization, user=existing_user).exists():
                return Response(
                    {"detail": f"User '{existing_user.username}' is already a member of this organization."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate role belongs to this organization
            role = Role.objects.filter(pk=role_id, organization=organization).first()
            if not role:
                return Response(
                    {"detail": "The selected role is invalid for this organization."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Assign the existing user directly
            membership = OrganizationUser.objects.create(
                organization=organization,
                user=existing_user,
                role=role,
                is_active=True,
            )

            # Update user's organization foreign key if unset
            if not existing_user.organization:
                existing_user.organization = organization
                existing_user.save(update_fields=['organization'])

            output = OrganizationUserSerializer(membership)
            return Response(output.data, status=status.HTTP_201_CREATED)
        # ==========================================================

        # If no password was provided and existing user wasn't found:
        password = request.data.get('password')
        if not password:
            identifier = username or email or "specified user"
            return Response(
                {"detail": f"No existing account found with username or email '{identifier}'. To create a new account, please fill in all details including a password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Logic for creating a brand new user
        serializer = OrganizationUserCreateSerializer(
            data=request.data,
            context={
                "request": request,
                "organization": organization,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        membership = serializer.save()

        output = OrganizationUserSerializer(
            membership
        )

        return Response(
            output.data,
            status=status.HTTP_201_CREATED,
        )


class OrganizationUserDetailView(APIView):
    """
    Retrieve or update a user belonging to the current
    organization.

    Organization scoping prevents cross-tenant access.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    def check_manage_users(self, user):
        if not (
            OrganizationAccessService
            .has_permission(
                user,
                "manage_users",
            )
        ):
            raise PermissionDenied(
                "You do not have permission to manage users."
            )

    def get_object(self, request, pk):
        organization = (
            OrganizationAccessService
            .get_organization(
                request.user
            )
        )

        if organization is None:
            return None

        return (
            OrganizationUser.objects
            .filter(
                pk=pk,
                organization=organization,
            )
            .select_related(
                "user",
                "role",
            )
            .prefetch_related(
                "role__permissions"
            )
            .first()
        )

    def get(self, request, pk):
        self.check_manage_users(
            request.user
        )

        membership = self.get_object(
            request,
            pk,
        )

        if membership is None:
            return Response(
                {
                    "detail":
                        "Organization user not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OrganizationUserSerializer(
            membership
        )

        return Response(
            serializer.data
        )

    def patch(self, request, pk):
        self.check_manage_users(
            request.user
        )

        membership = self.get_object(
            request,
            pk,
        )

        if membership is None:
            return Response(
                {
                    "detail":
                        "Organization user not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Protect the organization owner from accidental
        # deactivation or role reassignment.
        if (
            membership.user_id
            == membership.organization.owner_id
            and (
                "role_id" in request.data
                or request.data.get("is_active") is False
            )
        ):
            return Response(
                {
                    "detail": (
                        "The organization owner's role "
                        "or active membership cannot be "
                        "changed here."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OrganizationUserUpdateSerializer(
            membership,
            data=request.data,
            partial=True,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        membership = serializer.save()

        output = OrganizationUserSerializer(
            membership
        )

        return Response(
            output.data,
            status=status.HTTP_200_OK,
        )