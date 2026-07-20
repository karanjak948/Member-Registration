from rest_framework import viewsets

from ..models import FieldConfiguration
from ..permissions import IsAdminOrReadOnly
from ..serializers import FieldConfigurationSerializer


class FieldConfigurationViewSet(viewsets.ModelViewSet):

    queryset = (
        FieldConfiguration.objects
        .select_related("category")
        .all()
    )

    serializer_class = FieldConfigurationSerializer

    permission_classes = [
        IsAdminOrReadOnly,
    ]