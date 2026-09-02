from django.contrib import admin
from apps.loans.models import (
    LoanProduct,
    LoanProductFee,
    LoanProductPenalty,
    Loan,
    LoanScheduleEntry,
    LoanGuarantor,
    LoanCollateral,
    Repayment,
    LedgerAccount,
    LedgerTransaction,
    LedgerEntry,
    LoanReschedule,
)


class LoanProductFeeInline(admin.TabularInline):
    model = LoanProductFee
    extra = 0


class LoanProductPenaltyInline(admin.TabularInline):
    model = LoanProductPenalty
    extra = 0


@admin.register(LoanProduct)
class LoanProductAdmin(admin.ModelAdmin):
    list_display = ["product_code", "version_number", "product_name", "interest_method", "interest_rate", "is_active", "effective_date"]
    list_filter = ["is_active", "interest_method", "repayment_frequency"]
    search_fields = ["product_code", "product_name"]
    inlines = [LoanProductFeeInline, LoanProductPenaltyInline]


class LoanScheduleEntryInline(admin.TabularInline):
    model = LoanScheduleEntry
    extra = 0
    readonly_fields = ["period_number", "due_date", "expected_amount", "expected_principal", "expected_interest", "paid_principal", "paid_interest", "is_paid", "paid_date"]


class LoanGuarantorInline(admin.TabularInline):
    model = LoanGuarantor
    extra = 0


class LoanCollateralInline(admin.TabularInline):
    model = LoanCollateral
    extra = 0


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ["loan_number", "member", "loan_product", "principal_amount", "status", "outstanding_balance", "application_date", "disbursement_date"]
    list_filter = ["status", "interest_method", "repayment_frequency"]
    search_fields = ["loan_number", "member__first_name", "member__other_names", "member__membership_number"]
    inlines = [LoanGuarantorInline, LoanCollateralInline, LoanScheduleEntryInline]


@admin.register(Repayment)
class RepaymentAdmin(admin.ModelAdmin):
    list_display = ["repayment_number", "loan", "payment_date", "amount_paid", "payment_method", "transaction_reference", "allocated_principal", "allocated_interest"]
    list_filter = ["payment_method", "payment_date"]
    search_fields = ["repayment_number", "transaction_reference", "loan__loan_number"]


class LedgerEntryInline(admin.TabularInline):
    model = LedgerEntry
    extra = 0


@admin.register(LedgerAccount)
class LedgerAccountAdmin(admin.ModelAdmin):
    list_display = ["account_code", "account_name", "account_type", "is_active"]
    list_filter = ["account_type", "is_active"]
    search_fields = ["account_code", "account_name"]


@admin.register(LedgerTransaction)
class LedgerTransactionAdmin(admin.ModelAdmin):
    list_display = ["transaction_number", "transaction_date", "reference_type", "reference_id", "loan"]
    list_filter = ["reference_type", "transaction_date"]
    search_fields = ["transaction_number", "reference_id", "loan__loan_number"]
    inlines = [LedgerEntryInline]
