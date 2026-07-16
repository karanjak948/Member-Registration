from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Organization
from .serializers import OrganizationSerializer


class OrganizationAPIView(APIView):
    """
    Singleton API for the system organization.
    Supports:
        GET
        PUT
        PATCH
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_object(self):
        return Organization.objects.first()

    def get(self, request):
        organization = self.get_object()

        if organization is None:
            return Response(
                {
                    "detail": "Organization has not been configured."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OrganizationSerializer(
            organization
        )

        return Response(serializer.data)

    def put(self, request):
        organization = self.get_object()

        if organization is None:
            return Response(
                {
                    "detail": "Organization has not been configured."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OrganizationSerializer(
            organization,
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(serializer.data)

    def patch(self, request):
        organization = self.get_object()

        if organization is None:
            return Response(
                {
                    "detail": "Organization has not been configured."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OrganizationSerializer(
            organization,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(serializer.data)


class OrganizationLogoUploadView(APIView):
    """
    API endpoint for uploading and updating the organization logo.
    Supports:
        PATCH - Upload/Update logo
        DELETE - Remove logo
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def get_object(self):
        return Organization.objects.first()

    def patch(self, request):
        organization = self.get_object()

        if organization is None:
            return Response(
                {
                    "detail": "Organization has not been configured."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate file
        if "logo" not in request.FILES:
            return Response(
                {
                    "detail": "No logo file provided."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        logo_file = request.FILES["logo"]

        # Validate file type
        valid_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if logo_file.content_type not in valid_types:
            return Response(
                {
                    "detail": "Invalid file type. Please upload JPEG, PNG, GIF, or WEBP."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size (2MB max)
        if logo_file.size > 2097152:  # 2MB in bytes
            return Response(
                {
                    "detail": "File size exceeds 2MB limit."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save the logo
        if organization.logo:
            organization.logo.delete(save=False)
        
        organization.logo = logo_file
        organization.save()

        serializer = OrganizationSerializer(organization)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        organization = self.get_object()

        if organization is None:
            return Response(
                {
                    "detail": "Organization has not been configured."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Remove the logo
        if organization.logo:
            organization.logo.delete(save=True)
        else:
            return Response(
                {
                    "detail": "No logo found to remove."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "detail": "Logo removed successfully."
            },
            status=status.HTTP_200_OK,
        )