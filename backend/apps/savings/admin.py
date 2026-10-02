from django.contrib import admin
from apps.savings.models import SavingsPayment, SavingsWithdrawal


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
        "is_reversed",
        "week",
        "month",
        "year",
    ]
    list_filter = ["savings_type", "transaction_type", "payment_mode", "is_reversed", "year", "month"]
    search_fields = [
        "document_no",
        "transaction_no",
        "member__first_name",
        "member__other_names",
        "member__membership_number",
    ]


@admin.register(SavingsWithdrawal)
class SavingsWithdrawalAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "member",
        "payroll_no",
        "withdrawal_type",
        "amount",
        "date_withdrawn",
        "savings_drawn_from",
        "bank",
        "is_active",
        "created_at",
    ]
    list_filter = ["withdrawal_type", "savings_drawn_from", "bank", "is_active"]
    search_fields = ["member__first_name", "member__other_names", "payroll_no", "document_code", "reason"]

