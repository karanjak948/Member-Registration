from django.contrib import admin
from apps.shares.models import SharePayment, ShareTransfer


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
        "is_reversed",
        "transaction_no",
    ]
    list_filter = ["share_type", "payment_mode", "is_reversed", "paid_on"]
    search_fields = [
        "document_no",
        "transaction_no",
        "member__first_name",
        "member__other_names",
        "member__membership_number",
    ]
    ordering = ["-paid_on", "-created_at"]


@admin.register(ShareTransfer)
class ShareTransferAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "from_member",
        "to_member",
        "share_type",
        "number_of_shares",
        "shares_amount",
        "total_amount",
        "date_transferred",
        "is_active",
        "created_at",
    ]
    list_filter = ["share_type", "is_active", "date_transferred"]
    search_fields = [
        "from_member__first_name",
        "from_member__other_names",
        "from_member__membership_number",
        "to_member__first_name",
        "to_member__other_names",
        "to_member__membership_number",
        "remarks",
    ]
    ordering = ["-date_transferred", "-created_at"]

