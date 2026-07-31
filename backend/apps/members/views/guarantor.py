from rest_framework import serializers, viewsets

from ..models import Guarantor
from ..permissions import (
    IsAuthenticatedUser,
    get_user_organization_membership,
)
from ..serializers import GuarantorSerializer


class GuarantorViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for guarantors belonging to members
    in the authenticated user's organization.

    A linked guarantor_member must belong to the same
    organization as the authenticated user.
    """

    serializer_class = GuarantorSerializer

    permission_classes = [
        IsAuthenticatedUser,
    ]

    def get_membership(self):
        if not hasattr(self, "_organization_membership"):
            self._organization_membership = (
                get_user_organization_membership(
                    self.request.user
                )
            )

        return self._organization_membership

    def get_queryset(self):
        membership = self.get_membership()

        if membership is None:
            return Guarantor.objects.none()

        queryset = (
            Guarantor.objects
            .select_related(
                "member",
                "member__organization",
                "guarantor_member",
                "guarantor_member__organization",
            )
            .filter(
                member__organization=membership.organization,
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

        membership = self.get_membership()

        if (
            member.organization_id
            != membership.organization_id
        ):
            raise serializers.ValidationError(
                {
                    "member":
                        "The selected member does not belong "
                        "to your organization."
                }
            )

        if (
            guarantor_member is not None
            and guarantor_member.organization_id
            != membership.organization_id
        ):
            raise serializers.ValidationError(
                {
                    "guarantor_member":
                        "The selected guarantor member does "
                        "not belong to your organization."
                }
            )

        serializer.save()