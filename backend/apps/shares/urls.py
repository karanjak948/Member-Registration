from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.shares.views import SharePaymentViewSet

router = DefaultRouter()
router.register(r"shares-payments", SharePaymentViewSet, basename="shares-payment")
router.register(r"shares", SharePaymentViewSet, basename="shares")

urlpatterns = [
    path("", include(router.urls)),
]
