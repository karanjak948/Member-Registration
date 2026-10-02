from django.contrib import admin
from apps.deductions.models import MonthlyDeduction, MonthlyDeductionBatch, MonthlyDeductionItemLog


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


@admin.register(MonthlyDeductionItemLog)
class MonthlyDeductionItemLogAdmin(admin.ModelAdmin):
    from apps.deductions.models import MonthlyDeductionItemLog
    list_display = (
        "id",
        "batch",
        "row_number",
        "raw_employee_no",
        "raw_employee_name",
        "raw_total_ded",
        "amount_loan_principal",
        "amount_loan_interest",
        "amount_savings",
        "amount_shares",
        "status",
    )
    list_filter = ("status", "batch__year", "batch__month")
    search_fields = ("raw_employee_no", "raw_employee_name", "member__membership_number")

