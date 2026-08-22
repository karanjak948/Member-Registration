from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html, mark_safe

from .models import User
from apps.organizations.models import Organization


class CustomUserAdmin(UserAdmin):
    # Add 'organization' to the list display so you can see it in the table
    list_display = ('username', 'email', 'first_name', 'last_name', 'organization_display', 'is_staff')
    
    # Add search fields
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    # Add 'organization' to the fieldsets so it appears on the User edit page
    fieldsets = UserAdmin.fieldsets + (
        (None, {
            'fields': ('organization',),
        }),
    )

    def organization_display(self, obj):
        """Helper to display organization name nicely in the admin list"""
        if obj.organization:
            # Use mark_safe for valid HTML strings without placeholders
            return mark_safe(f'<span style="font-weight:bold;">{obj.organization.name}</span>')
        
        # Use mark_safe for plain HTML without placeholders
        return mark_safe('<span style="color:gray;">Not Assigned</span>')
        
    organization_display.short_description = 'Organization'

# Check if User is already registered. If so, unregister it first.
if admin.site.is_registered(User):
    admin.site.unregister(User)

# Register your custom UserAdmin
admin.site.register(User, CustomUserAdmin)