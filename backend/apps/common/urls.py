from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.common.views import PaymentReversalLogViewSet

router = DefaultRouter()
router.register(r"reversals", PaymentReversalLogViewSet, basename="payment-reversal-log")

urlpatterns = [
    path("", include(router.urls)),
]
