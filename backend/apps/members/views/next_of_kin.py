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