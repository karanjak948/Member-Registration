from rest_framework import serializers

from apps.common.views import OrganizationScopedViewSet

from ..models import NextOfKin
from ..permissions import IsAuthenticatedUser
from ..serializers import NextOfKinSerializer


class NextOfKinViewSet(OrganizationScopedViewSet):
    """
    CRUD operations for next-of-kin records belonging
    to members in the authenticated user's organization.
    """

    serializer_class = NextOfKinSerializer

    permission_classes = [
        IsAuthenticatedUser,
    ]

    def get_queryset(self):
        organization = self.get_organization()

        if organization is None:
            return NextOfKin.objects.none()

        queryset = (
            NextOfKin.objects
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