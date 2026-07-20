from rest_framework import viewsets

from ..models import Vehicle
from ..permissions import IsAdminOrReadOnly
from ..serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):

    queryset = (
        Vehicle.objects
        .select_related("member")
        .all()
    )

    serializer_class = VehicleSerializer

    permission_classes = [
        IsAdminOrReadOnly,
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        member = self.request.query_params.get("member")

        if member:
            queryset = queryset.filter(member_id=member)

        return queryset