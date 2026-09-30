from django.contrib import admin
from apps.deductions.models import MonthlyDeduction, MonthlyDeductionBatch


@admin.register(MonthlyDeduction)
class MonthlyDeductionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "member",
        "month",
        "year",
        "total_expected",
        "amount_paid",
        "balance",
        "status",
        "created_at",
    )
    list_filter = ("year", "month", "status", "organization")
    search_fields = (
        "member__first_name",
        "member__other_names",
        "member__membership_number",
        "member__national_id",
    )
    readonly_fields = ("total_expected", "balance", "created_at", "updated_at")


@admin.register(MonthlyDeductionBatch)
class MonthlyDeductionBatchAdmin(admin.ModelAdmin):
    list_display = (
        "batch_no",
        "month",
        "year",
        "total_amount",
        "row_count",
        "success_count",
        "error_count",
        "uploaded_by",
        "created_at",
    )
    list_filter = ("year", "month", "organization")
    search_fields = ("batch_no", "remarks")
    readonly_fields = ("created_at", "updated_at")
