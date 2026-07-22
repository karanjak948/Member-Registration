from rest_framework import serializers, viewsets

from ..models import NextOfKin
from ..permissions import IsAuthenticatedUser
from ..serializers import NextOfKinSerializer


class NextOfKinViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for next-of-kin records belonging
    to members owned by the authenticated user.
    """

    serializer_class = NextOfKinSerializer

    permission_classes = [
        IsAuthenticatedUser,
    ]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return NextOfKin.objects.none()

        queryset = (
            NextOfKin.objects
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
                        "You cannot add Next of Kin "
                        "information to this member."
                }
            )

        serializer.save()