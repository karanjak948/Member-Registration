from rest_framework import serializers

from apps.common.views import OrganizationScopedViewSet

from ..models import Vehicle
from ..permissions import IsAuthenticatedUser
from ..serializers import VehicleSerializer


class VehicleViewSet(OrganizationScopedViewSet):
    """
    CRUD operations for vehicles belonging to members
    in the authenticated user's organization.
    """

    serializer_class = VehicleSerializer

    permission_classes = [
        IsAuthenticatedUser,
    ]

    def get_queryset(self):
        organization = self.get_organization()

        if organization is None:
            return Vehicle.objects.none()

        queryset = (
            Vehicle.objects
            .select_related(
                "member",
                "member__organization",
            )
            .filter(
                member__organization=organization,
            )
        )

        member_id = self.request.query_params.get(
            "member"
        )

        if member_id:
            queryset = queryset.filter(
                member_id=member_id
            )

        return queryset

    def perform_create(self, serializer):
        member = serializer.validated_data[
            "member"
        ]

        organization = self.get_organization()

        if (
            member.organization_id
            != organization.id
        ):
            raise serializers.ValidationError(
                {
                    "member":
                        "The selected member does not belong "
                        "to your organization."
                }
            )

        serializer.save()