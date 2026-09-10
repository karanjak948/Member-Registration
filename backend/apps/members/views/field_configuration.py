from rest_framework import viewsets

from ..models import FieldConfiguration
from ..permissions import IsAdminOrReadOnly
from ..serializers import FieldConfigurationSerializer


class FieldConfigurationViewSet(viewsets.ModelViewSet):
    queryset = FieldConfiguration.objects.select_related("category").all()
    serializer_class = FieldConfigurationSerializer

    permission_classes = [
        IsAdminOrReadOnly,
    ]

    def get_queryset(self):
        queryset = (
            FieldConfiguration.objects
            .select_related("category")
            .all()
        )
        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset