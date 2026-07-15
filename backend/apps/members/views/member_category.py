from rest_framework import viewsets

from ..models import MemberCategory
from ..permissions import IsAdminOrReadOnly
from ..serializers import MemberCategorySerializer


class MemberCategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD for member categories.
    """

    queryset = MemberCategory.objects.all()

    serializer_class = MemberCategorySerializer

    permission_classes = [
        IsAdminOrReadOnly,
    ]