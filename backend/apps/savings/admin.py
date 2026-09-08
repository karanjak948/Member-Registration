from django.contrib import admin
from apps.savings.models import SavingsPayment


@admin.register(SavingsPayment)
class SavingsPaymentAdmin(admin.ModelAdmin):
    list_display = [
        "document_no",
        "member",
        "savings_type",
        "transaction_type",
        "amount",
        "payment_mode",
        "paid_on",
        "week",
        "month",
        "year",
    ]
    list_filter = ["savings_type", "transaction_type", "payment_mode", "year", "month"]
    search_fields = [
        "document_no",
        "transaction_no",
        "member__first_name",
        "member__other_names",
        "member__membership_number",
    ]
