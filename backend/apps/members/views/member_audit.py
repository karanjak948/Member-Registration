from rest_framework import viewsets

from ..models import MemberAudit
from ..permissions import IsAdminOrReadOnly
from ..serializers import MemberAuditSerializer


class MemberAuditViewSet(
    viewsets.ReadOnlyModelViewSet
):

    queryset = (
        MemberAudit.objects
        .select_related(
            "member",
            "changed_by",
        )
        .all()
    )

    serializer_class = MemberAuditSerializer

    permission_classes = [
        IsAdminOrReadOnly,
    ]