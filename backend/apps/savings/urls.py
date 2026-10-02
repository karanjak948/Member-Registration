from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.savings.views import SavingsPaymentViewSet, SavingsWithdrawalViewSet

router = DefaultRouter()
router.register(r"savings-payments", SavingsPaymentViewSet, basename="savings-payment")
router.register(r"savings-withdrawals", SavingsWithdrawalViewSet, basename="savings-withdrawal")

urlpatterns = [
    path("", include(router.urls)),
]
