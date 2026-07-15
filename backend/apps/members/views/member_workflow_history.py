from rest_framework import viewsets

from ..models import MemberWorkflowHistory
from ..permissions import IsAdminOrReadOnly
from ..serializers import (
    MemberWorkflowHistorySerializer,
)


class MemberWorkflowHistoryViewSet(
    viewsets.ReadOnlyModelViewSet
):

    queryset = (
        MemberWorkflowHistory.objects
        .select_related(
            "member",
            "changed_by",
        )
        .all()
    )

    serializer_class = (
        MemberWorkflowHistorySerializer
    )

    permission_classes = [
        IsAdminOrReadOnly,
    ]