from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.views import OrganizationScopedViewSet

from ..models import Member
from ..permissions import HasMemberPermission
from ..serializers import MemberSerializer
from ..services import MemberService


class MemberViewSet(OrganizationScopedViewSet):
    """
    Organization-scoped CRUD and workflow operations
    for members.

    Business-data ownership belongs to the organization.

    created_by records which application user originally
    created the member, but it does not determine visibility
    or authorization.

    Access is controlled through organization membership
    and role-based permissions.
    """

    serializer_class = MemberSerializer

    permission_classes = [
        HasMemberPermission,
    ]

    def get_queryset(self):
        """
        Return only members belonging to the authenticated
        user's organization.

        This prevents cross-organization access even when
        a user guesses another member's primary key.
        """

        organization = self.get_organization()

        if organization is None:
            return Member.objects.none()

        return (
            Member.objects
            .select_related(
                "organization",
                "category",
                "created_by",
            )
            .filter(
                organization=organization,
            )
        )

    def perform_create(self, serializer):
        """
        Assign organization and creator exclusively on the
        server.

        Clients must never choose either ownership field.
        """

        organization = self.get_organization()

        MemberService.create_member(
            serializer=serializer,
            user=self.request.user,
            organization=organization,
        )

    def perform_update(self, serializer):
        """
        get_queryset() guarantees that only a member from
        the current organization can reach this method.
        """

        MemberService.update_member(
            serializer=serializer,
            user=self.request.user,
        )

    def perform_destroy(self, instance):
        """
        Delete an organization-scoped member.

        Authorization has already been enforced by
        HasMemberPermission and get_queryset().
        """

        MemberService.delete_member(
            member=instance,
            user=self.request.user,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="approve",
    )
    def approve(self, request, pk=None):
        member = self.get_object()

        MemberService.approve_member(
            member=member,
            user=request.user,
            remarks=request.data.get(
                "remarks",
                "",
            ),
        )

        return Response(
            self.get_serializer(member).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="reject",
    )
    def reject(self, request, pk=None):
        member = self.get_object()

        MemberService.reject_member(
            member=member,
            user=request.user,
            remarks=request.data.get(
                "remarks",
                "",
            ),
        )

        return Response(
            self.get_serializer(member).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="activate",
    )
    def activate(self, request, pk=None):
        member = self.get_object()

        MemberService.activate_member(
            member=member,
            user=request.user,
        )

        return Response(
            self.get_serializer(member).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="deactivate",
    )
    def deactivate(self, request, pk=None):
        member = self.get_object()

        MemberService.deactivate_member(
            member=member,
            user=request.user,
        )

        return Response(
            self.get_serializer(member).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="complete-registration",
    )
    def complete_registration(self, request, pk=None):
        member = self.get_object()

        MemberService.complete_registration(
            member=member,
            user=request.user,
        )

        return Response(
            self.get_serializer(member).data,
            status=status.HTTP_200_OK,
        )