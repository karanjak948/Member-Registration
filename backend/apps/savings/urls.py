from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.savings.views import SavingsPaymentViewSet

router = DefaultRouter()
router.register(r"savings-payments", SavingsPaymentViewSet, basename="savings-payment")

urlpatterns = [
    path("", include(router.urls)),
]
