from django.contrib import admin

from .models import (
    FieldConfiguration,
    Guarantor,
    Member,
    MemberAudit,
    MemberCategory,
    MemberConfiguration,
    MemberWorkflowHistory,
    NextOfKin,
    Vehicle,
)


class NextOfKinInline(admin.TabularInline):
    model = NextOfKin
    extra = 0


class VehicleInline(admin.TabularInline):
    model = Vehicle
    extra = 0


class GuarantorInline(admin.TabularInline):
    model = Guarantor
    fk_name = "member"
    extra = 0


@admin.register(MemberCategory)
class MemberCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "is_active",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "name",
        "code",
    )

    list_per_page = 25


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = (
        "membership_number",
        "first_name",
        "other_names",
        "national_id",
        "phone_number",
        "category",
        "status",
        "registration_stage",
        "created_at",
    )

    list_filter = (
        "category",
        "status",
        "registration_stage",
    )

    search_fields = (
        "membership_number",
        "first_name",
        "other_names",
        "national_id",
        "phone_number",
    )

    readonly_fields = (
        "membership_number",
        "created_at",
        "updated_at",
    )

    autocomplete_fields = (
        "category",
        "created_by",
    )

    list_select_related = (
        "category",
        "created_by",
    )

    date_hierarchy = "created_at"

    list_per_page = 25

    inlines = [
        NextOfKinInline,
        VehicleInline,
        GuarantorInline,
    ]


@admin.register(NextOfKin)
class NextOfKinAdmin(admin.ModelAdmin):
    list_display = (
        "member",
        "first_name",
        "other_names",
        "relationship",
        "phone_number",
        "is_primary",
    )

    list_filter = (
        "relationship",
        "is_primary",
    )

    search_fields = (
        "first_name",
        "other_names",
        "phone_number",
    )

    autocomplete_fields = (
        "member",
    )

    list_select_related = (
        "member",
    )

    list_per_page = 25


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = (
        "registration_number",
        "member",
        "make",
        "model",
        "year",
    )

    search_fields = (
        "registration_number",
        "make",
        "model",
    )

    autocomplete_fields = (
        "member",
    )

    list_select_related = (
        "member",
    )

    list_per_page = 25


@admin.register(Guarantor)
class GuarantorAdmin(admin.ModelAdmin):
    list_display = (
        "member",
        "guarantor_member",
        "first_name",
        "other_names",
        "phone_number",
        "relationship",
    )

    list_filter = (
        "relationship",
    )

    search_fields = (
        "first_name",
        "other_names",
        "phone_number",
        "national_id",
    )

    autocomplete_fields = (
        "member",
        "guarantor_member",
    )

    list_select_related = (
        "member",
        "guarantor_member",
    )

    list_per_page = 25


@admin.register(MemberAudit)
class MemberAuditAdmin(admin.ModelAdmin):
    list_display = (
        "member",
        "action",
        "changed_by",
        "created_at",
    )

    list_filter = (
        "action",
    )

    readonly_fields = (
        "member",
        "action",
        "changed_by",
        "old_data",
        "new_data",
        "created_at",
    )

    list_select_related = (
        "member",
        "changed_by",
    )

    date_hierarchy = "created_at"

    list_per_page = 50

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(FieldConfiguration)
class FieldConfigurationAdmin(admin.ModelAdmin):
    list_display = (
        "category",
        "display_name",
        "field_name",
        "is_visible",
        "is_required",
        "display_order",
    )

    list_filter = (
        "category",
        "is_visible",
        "is_required",
    )

    autocomplete_fields = (
        "category",
    )

    list_select_related = (
        "category",
    )

    list_per_page = 25


@admin.register(MemberConfiguration)
class MemberConfigurationAdmin(admin.ModelAdmin):
    list_display = (
        "show_next_of_kin",
        "show_vehicle",
        "show_guarantor",
        "show_kra_pin",
        "require_phone",
        "require_national_id",
    )


@admin.register(MemberWorkflowHistory)
class MemberWorkflowHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "member",
        "previous_stage",
        "current_stage",
        "changed_by",
        "changed_at",
    )

    readonly_fields = (
        "member",
        "previous_stage",
        "current_stage",
        "remarks",
        "changed_by",
        "changed_at",
    )

    autocomplete_fields = (
        "member",
        "changed_by",
    )

    list_select_related = (
        "member",
        "changed_by",
    )

    date_hierarchy = "changed_at"

    list_per_page = 50

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False