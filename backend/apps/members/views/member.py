from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Member
from ..permissions import IsAuthenticatedUser
from ..serializers import MemberSerializer
from ..services import MemberService


class MemberViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for members owned by the
    authenticated user.

    All collection and detail operations are scoped through
    created_by. A user cannot retrieve another user's member
    by guessing its primary key.
    """

    serializer_class = MemberSerializer

    permission_classes = [
        IsAuthenticatedUser,
    ]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Member.objects.none()

        return (
            Member.objects
            .select_related(
                "category",
                "created_by",
            )
            .filter(
                created_by=user,
            )
        )

    def perform_create(self, serializer):
        """
        Ownership is assigned server-side.

        The client must never choose created_by.
        """
        MemberService.create_member(
            serializer=serializer,
            user=self.request.user,
        )

    def perform_update(self, serializer):
        """
        get_queryset() guarantees that only an owned
        member can reach this method.
        """
        MemberService.update_member(
            serializer=serializer,
            user=self.request.user,
        )

    def perform_destroy(self, instance):
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
        url_path="convert",
    )
    def convert(self, request, pk=None):
        member = self.get_object()

        MemberService.convert_member(
            member=member,
            user=request.user,
        )

        return Response(
            self.get_serializer(member).data,
            status=status.HTTP_200_OK,
        )