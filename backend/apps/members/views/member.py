from django.db.models import Q
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
        user's organization with indexed search and filtering support.

        Supports server-side filtering by:
        - `search`: First name, other names, membership number, national ID, phone, email, or KRA PIN
        - `status`: Member status (ACTIVE, INACTIVE, SUSPENDED)
        - `stage`: Registration stage (DATA_CAPTURE_PENDING, APPROVED, REJECTED, ACTIVE)
        - `category`: Member category ID
        """

        organization = self.get_organization()

        if organization is None:
            return Member.objects.none()

        qs = (
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

        # Server-side search for 1,000+ members
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(other_names__icontains=search) |
                Q(membership_number__icontains=search) |
                Q(national_id__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(email__icontains=search) |
                Q(kra_pin__icontains=search)
            )

        # Filter by status
        member_status = (self.request.query_params.get("status") or "").strip()
        if member_status:
            qs = qs.filter(status=member_status)

        # Filter by registration stage
        stage = (self.request.query_params.get("stage") or "").strip()
        if stage:
            qs = qs.filter(registration_stage=stage)

        # Filter by category
        category = (self.request.query_params.get("category") or "").strip()
        if category:
            qs = qs.filter(category_id=category)

        return qs.order_by("-created_at", "-id")

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

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-activate",
    )
    def bulk_activate(self, request):
        member_ids = request.data.get("member_ids", [])
        if not isinstance(member_ids, list) or not member_ids:
            return Response(
                {"detail": "member_ids must be a non-empty list of integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = MemberService.bulk_activate_members(
            member_ids=member_ids,
            user=request.user,
            organization=self.get_organization(),
        )

        return Response(
            result,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-deactivate",
    )
    def bulk_deactivate(self, request):
        member_ids = request.data.get("member_ids", [])
        reason = request.data.get("reason", "")

        if not isinstance(member_ids, list) or not member_ids:
            return Response(
                {"detail": "member_ids must be a non-empty list of integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = MemberService.bulk_deactivate_members(
            member_ids=member_ids,
            user=request.user,
            organization=self.get_organization(),
            reason=reason,
        )

        return Response(
            result,
            status=status.HTTP_200_OK,
        )