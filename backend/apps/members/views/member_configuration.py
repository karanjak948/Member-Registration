from rest_framework import viewsets

from ..models import MemberConfiguration
from ..permissions import IsAdminOrReadOnly
from ..serializers import MemberConfigurationSerializer


class MemberConfigurationViewSet(viewsets.ModelViewSet):

    queryset = MemberConfiguration.objects.all()

    serializer_class = MemberConfigurationSerializer

    permission_classes = [
        IsAdminOrReadOnly,
    ]