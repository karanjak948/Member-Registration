from rest_framework import status
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Organization
from .serializers import OrganizationSerializer


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
        return (
            Organization.objects
            .filter(owner=user)
            .first()
        )

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
            serializer.save(
                owner=request.user
            )

            response_status = (
                status.HTTP_201_CREATED
            )
        else:
            serializer.save()

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
            serializer.save(
                owner=request.user
            )

            response_status = (
                status.HTTP_201_CREATED
            )
        else:
            serializer.save()

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
        return (
            Organization.objects
            .filter(owner=user)
            .first()
        )

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

        old_logo = organization.logo

        organization.logo = logo_file
        organization.save(
            update_fields=[
                "logo",
                "updated_at",
            ]
        )

        if old_logo:
            old_logo.delete(
                save=False
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