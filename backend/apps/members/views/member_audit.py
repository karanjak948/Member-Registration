from rest_framework import viewsets

from ..models import MemberAudit
from ..permissions import IsAuthenticatedUser
from ..serializers import MemberAuditSerializer


class MemberAuditViewSet(
    viewsets.ReadOnlyModelViewSet
):
    """
    Read-only audit records scoped to members owned
    by the currently authenticated user.

    Ownership chain:
        MemberAudit -> Member -> created_by
    """

    serializer_class = MemberAuditSerializer

    permission_classes = [
        IsAuthenticatedUser,
    ]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return MemberAudit.objects.none()

        queryset = (
            MemberAudit.objects
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