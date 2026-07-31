from rest_framework import serializers

from apps.common.views import OrganizationScopedViewSet

from ..models import Guarantor
from ..permissions import IsAuthenticatedUser
from ..serializers import GuarantorSerializer


class GuarantorViewSet(OrganizationScopedViewSet):
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

    def get_queryset(self):
        organization = self.get_organization()

        if organization is None:
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

        guarantor_member = (
            serializer.validated_data.get(
                "guarantor_member"
            )
        )

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

        if (
            guarantor_member is not None
            and guarantor_member.organization_id
            != organization.id
        ):
            raise serializers.ValidationError(
                {
                    "guarantor_member":
                        "The selected guarantor member does "
                        "not belong to your organization."
                }
            )

        serializer.save()