from rest_framework import serializers, viewsets

from ..models import Vehicle
from ..permissions import IsAuthenticatedUser
from ..serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for vehicles belonging to members
    owned by the authenticated user.
    """

    serializer_class = VehicleSerializer

    permission_classes = [
        IsAuthenticatedUser,
    ]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Vehicle.objects.none()

        queryset = (
            Vehicle.objects
            .select_related(
                "member",
                "member__created_by",
            )
            .filter(
                member__created_by=user,
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

        if (
            member.created_by_id
            != self.request.user.id
        ):
            raise serializers.ValidationError(
                {
                    "member":
                        "You cannot add a vehicle "
                        "to this member."
                }
            )

        serializer.save()