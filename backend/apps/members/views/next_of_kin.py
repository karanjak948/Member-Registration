from rest_framework import viewsets

from ..models import NextOfKin
from ..permissions import IsAdminOrReadOnly
from ..serializers import NextOfKinSerializer


class NextOfKinViewSet(viewsets.ModelViewSet):

    queryset = (
        NextOfKin.objects
        .select_related("member")
        .all()
    )

    serializer_class = NextOfKinSerializer

    permission_classes = [
        IsAdminOrReadOnly,
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        member = self.request.query_params.get("member")

        if member:
            queryset = queryset.filter(member_id=member)

        return queryset