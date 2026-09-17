from django.contrib import admin
from apps.shares.models import SharePayment


@admin.register(SharePayment)
class SharePaymentAdmin(admin.ModelAdmin):
    list_display = [
        "document_no",
        "member",
        "share_type",
        "number_of_shares",
        "share_price",
        "total_amount",
        "payment_mode",
        "paid_on",
        "transaction_no",
    ]
    list_filter = ["share_type", "payment_mode", "paid_on"]
    search_fields = [
        "document_no",
        "transaction_no",
        "member__first_name",
        "member__other_names",
        "member__membership_number",
    ]
    ordering = ["-paid_on", "-created_at"]
