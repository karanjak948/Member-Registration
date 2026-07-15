from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "o/",
        include(
            "oauth2_provider.urls",
            namespace="oauth2_provider",
        ),
    ),

    path(
        "api/auth/",
        include("apps.authentication.urls"),
    ),

    path(
        "api/",
        include("apps.members.urls"),
    ),
]