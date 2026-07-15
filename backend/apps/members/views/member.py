from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Member
from ..permissions import IsAdminOrReadOnly
from ..serializers import MemberSerializer
from ..services import MemberService


class MemberViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for members.
    Business logic is delegated to MemberService.
    """

    queryset = (
        Member.objects
        .select_related(
            "category",
            "created_by",
        )
        .all()
    )

    serializer_class = MemberSerializer

    permission_classes = [
        IsAdminOrReadOnly,
    ]

    def perform_create(self, serializer):
        """
        Create a member through the service layer.
        """
        MemberService.create_member(
            serializer=serializer,
            user=self.request.user,
        )

    def perform_update(self, serializer):
        """
        Update a member through the service layer.
        """
        MemberService.update_member(
            serializer=serializer,
            user=self.request.user,
        )

    def perform_destroy(self, instance):
        """
        Delete a member through the service layer.
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
            remarks=request.data.get("remarks", ""),
        )

        serializer = self.get_serializer(member)

        return Response(
            serializer.data,
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
            remarks=request.data.get("remarks", ""),
        )

        serializer = self.get_serializer(member)

        return Response(
            serializer.data,
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

        serializer = self.get_serializer(member)

        return Response(
            serializer.data,
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

        serializer = self.get_serializer(member)

        return Response(
            serializer.data,
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

        serializer = self.get_serializer(member)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )