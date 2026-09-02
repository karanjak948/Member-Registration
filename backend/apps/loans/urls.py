from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.loans.views import (
    LoanProductViewSet,
    LoanViewSet,
    RepaymentViewSet,
    LedgerAccountViewSet,
    LedgerTransactionViewSet,
)

router = DefaultRouter()
router.register(r"loan-products", LoanProductViewSet, basename="loan-product")
router.register(r"loans", LoanViewSet, basename="loan")
router.register(r"repayments", RepaymentViewSet, basename="repayment")
router.register(r"ledger-accounts", LedgerAccountViewSet, basename="ledger-account")
router.register(r"ledger-transactions", LedgerTransactionViewSet, basename="ledger-transaction")

urlpatterns = [
    path("", include(router.urls)),
]
