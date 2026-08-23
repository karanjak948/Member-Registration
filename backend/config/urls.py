from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.views.static import serve

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

    path(
        "api/",
        include("apps.organizations.urls"),
    ),

    # Always serve media uploads directly (logos, passport photos, documents)
    re_path(
        r"^media/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT},
    ),
    re_path(
        r"^static/(?P<path>.*)$",
        serve,
        {"document_root": settings.STATIC_ROOT},
    ),
]