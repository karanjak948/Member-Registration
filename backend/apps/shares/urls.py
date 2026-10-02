from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.shares.views import SharePaymentViewSet, ShareTransferViewSet

router = DefaultRouter()
router.register(r"shares-payments", SharePaymentViewSet, basename="shares-payment")
router.register(r"shares", SharePaymentViewSet, basename="shares")
router.register(r"share-transfers", ShareTransferViewSet, basename="share-transfer")
router.register(r"transfers", ShareTransferViewSet, basename="shares-transfer-alias")

urlpatterns = [
    path("", include(router.urls)),
]
