from django.contrib import admin
from apps.common.models import PaymentReversalLog


@admin.register(PaymentReversalLog)
class PaymentReversalLogAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "payment_type",
        "document_or_receipt_no",
        "member",
        "amount_reversed",
        "reversed_by",
        "reversed_at",
    ]
    list_filter = ["payment_type", "reversed_at"]
    search_fields = [
        "document_or_receipt_no",
        "original_payment_id",
        "member__first_name",
        "member__other_names",
        "member__membership_number",
        "reversal_reason",
    ]
    readonly_fields = ["reversed_at", "created_at", "updated_at"]
