from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.loans.views import (
    LoanProductViewSet,
    LoanViewSet,
    RepaymentViewSet,
    LedgerAccountViewSet,
    LedgerTransactionViewSet,
    MpesaC2BConfirmationView,
    MpesaC2BValidationView,
    MpesaTransactionViewSet,
)

router = DefaultRouter()
router.register(r"loan-products", LoanProductViewSet, basename="loan-product")
router.register(r"loans", LoanViewSet, basename="loan")
router.register(r"repayments", RepaymentViewSet, basename="repayment")
router.register(r"ledger-accounts", LedgerAccountViewSet, basename="ledger-account")
router.register(r"ledger-transactions", LedgerTransactionViewSet, basename="ledger-transaction")
router.register(r"mpesa/transactions", MpesaTransactionViewSet, basename="mpesa-transaction")

urlpatterns = [
    # Safaricom Daraja C2B Paybill Callbacks
    path("mpesa/c2b/confirmation/", MpesaC2BConfirmationView.as_view(), name="mpesa-c2b-confirmation"),
    path("mpesa/c2b/validation/", MpesaC2BValidationView.as_view(), name="mpesa-c2b-validation"),
    path("", include(router.urls)),
]
