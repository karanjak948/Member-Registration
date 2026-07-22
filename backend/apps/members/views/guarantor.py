from rest_framework import serializers, viewsets

from ..models import Guarantor
from ..permissions import IsAuthenticatedUser
from ..serializers import GuarantorSerializer


class GuarantorViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for guarantors belonging to members
    owned by the authenticated user.

    A linked guarantor_member must belong to the same
    authenticated user's dataset.
    """

    serializer_class = GuarantorSerializer

    permission_classes = [
        IsAuthenticatedUser,
    ]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Guarantor.objects.none()

        queryset = (
            Guarantor.objects
            .select_related(
                "member",
                "member__created_by",
                "guarantor_member",
                "guarantor_member__created_by",
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

        guarantor_member = (
            serializer.validated_data.get(
                "guarantor_member"
            )
        )

        user = self.request.user

        if member.created_by_id != user.id:
            raise serializers.ValidationError(
                {
                    "member":
                        "You cannot add a guarantor "
                        "to this member."
                }
            )

        if (
            guarantor_member is not None
            and guarantor_member.created_by_id
            != user.id
        ):
            raise serializers.ValidationError(
                {
                    "guarantor_member":
                        "The selected guarantor member "
                        "does not belong to your account."
                }
            )

        serializer.save()