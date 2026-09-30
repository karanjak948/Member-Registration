from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.deductions.views import MonthlyDeductionViewSet, MonthlyDeductionBatchViewSet

router = DefaultRouter()
router.register(r"monthly-deductions", MonthlyDeductionViewSet, basename="monthly-deductions")
router.register(r"deduction-batches", MonthlyDeductionBatchViewSet, basename="deduction-batches")

urlpatterns = [
    path("", include(router.urls)),
]
