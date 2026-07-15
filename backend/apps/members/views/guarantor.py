from rest_framework import viewsets

from ..models import Guarantor
from ..permissions import IsAdminOrReadOnly
from ..serializers import GuarantorSerializer


class GuarantorViewSet(viewsets.ModelViewSet):

    queryset = (
        Guarantor.objects
        .select_related(
            "member",
            "guarantor_member",
        )
        .all()
    )

    serializer_class = GuarantorSerializer

    permission_classes = [
        IsAdminOrReadOnly,
    ]