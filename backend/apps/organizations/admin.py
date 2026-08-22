from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from django.utils.html import format_html

from .models import (
    Organization,
    Permission,
    Role,
    RolePermission,
    OrganizationUser,
)


# ============================================================
# ORGANIZATION ADMIN
# ============================================================

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "owner_display",
        "email",
        "phone_number",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "name",
        "code",
        "email",
        "phone_number",
        "owner__username",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Organization Information",
            {
                "fields": (
                    "owner",
                    "name",
                    "code",
                    "logo",
                    "email",
                    "phone_number",
                    "website",
                    "physical_address",
                )
            },
        ),
        (
            "Audit Information",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    def owner_display(self, obj):
        if obj.owner:
            return format_html(
                '<a href="{}">{}</a>',
                f"/admin/authentication/user/{obj.owner.id}/change/",
                obj.owner.username,
            )
        return "-"
    owner_display.short_description = "Owner"

    def has_add_permission(self, request):
        """
        Prevent creating more than one Organization.
        """
        if Organization.objects.exists():
            return False
        return super().has_add_permission(request)


# ============================================================
# PERMISSION ADMIN
# ============================================================

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "module",
        "created_at",
    )

    search_fields = (
        "code",
        "name",
        "module",
    )

    list_filter = (
        "module",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


# ============================================================
# ROLE ADMIN
# ============================================================

class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 1
    autocomplete_fields = ("permission",)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "organization",
        "is_system_role",
        "permission_count",
        "created_at",
    )

    search_fields = (
        "name",
        "organization__name",
    )

    list_filter = (
        "is_system_role",
        "organization",
    )

    readonly_fields = (
        "is_system_role",
        "created_at",
        "updated_at",
    )

    inlines = [
        RolePermissionInline,
    ]

    fieldsets = (
        (
            "Role Information",
            {
                "fields": (
                    "organization",
                    "name",
                    "description",
                    "is_system_role",
                )
            },
        ),
        (
            "Audit Information",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    def permission_count(self, obj):
        count = obj.permissions.count()
        return format_html('<span style="font-weight:bold;">{}</span>', count)
    permission_count.short_description = "Permissions"


# ============================================================
# ORGANIZATION USER ADMIN
# ============================================================

@admin.register(OrganizationUser)
class OrganizationUserAdmin(admin.ModelAdmin):
    list_display = (
        "user_display",
        "organization",
        "role",
        "is_active",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "organization__name",
        "role__name",
    )

    list_filter = (
        "is_active",
        "organization",
        "role",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Membership Information",
            {
                "fields": (
                    "organization",
                    "user",
                    "role",
                    "is_active",
                )
            },
        ),
        (
            "Audit Information",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    def user_display(self, obj):
        if obj.user:
            return format_html(
                '<a href="{}">{}</a> ({})',
                f"/admin/authentication/user/{obj.user.id}/change/",
                obj.user.username,
                obj.user.email,
            )
        return "-"
    user_display.short_description = "User"