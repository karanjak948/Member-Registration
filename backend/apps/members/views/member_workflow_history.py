from rest_framework import viewsets

from ..models import MemberWorkflowHistory
from ..permissions import IsAuthenticatedUser
from ..serializers import (
    MemberWorkflowHistorySerializer,
)


class MemberWorkflowHistoryViewSet(
    viewsets.ReadOnlyModelViewSet
):
    """
    Read-only workflow history for members owned
    by the currently authenticated user.

    Ownership is inherited through:
        MemberWorkflowHistory -> Member -> created_by
    """

    serializer_class = (
        MemberWorkflowHistorySerializer
    )

    permission_classes = [
        IsAuthenticatedUser,
    ]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return (
                MemberWorkflowHistory.objects.none()
            )

        queryset = (
            MemberWorkflowHistory.objects
            .select_related(
                "member",
                "changed_by",
            )
            .filter(
                member__created_by=user,
            )
        )

        member_id = (
            self.request.query_params.get(
                "member"
            )
        )

        if member_id:
            queryset = queryset.filter(
                member_id=member_id
            )

        return queryset