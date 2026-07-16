from django.contrib import admin

from .models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "email",
        "phone_number",
        "updated_at",
    )

    search_fields = (
        "name",
        "code",
        "email",
        "phone_number",
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

    def has_add_permission(self, request):
        """
        Prevent creating more than one Organization.
        """
        if Organization.objects.exists():
            return False
        return super().has_add_permission(request)