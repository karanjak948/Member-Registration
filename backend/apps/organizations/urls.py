from django.urls import path

from .views import (
    OrganizationAPIView,
    OrganizationLogoUploadView,
)

app_name = "organizations"

urlpatterns = [
    path(
        "organization/",
        OrganizationAPIView.as_view(),
        name="organization",
    ),

    path(
        "organization/logo/",
        OrganizationLogoUploadView.as_view(),
        name="organization-logo",
    ),
]