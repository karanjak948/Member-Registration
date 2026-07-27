from django.urls import path

from .views import (
    OrganizationAPIView,
    OrganizationLogoUploadView,
    OrganizationUserDetailView,
    OrganizationUserListCreateView,
    PermissionListAPIView,
    RoleDetailAPIView,
    RoleListCreateAPIView,
)


app_name = "organizations"


urlpatterns = [
    # --------------------------------------------------------
    # ORGANIZATION
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # RBAC — PERMISSIONS
    # --------------------------------------------------------

    path(
        "permissions/",
        PermissionListAPIView.as_view(),
        name="permission-list",
    ),

    # --------------------------------------------------------
    # RBAC — ROLES
    # --------------------------------------------------------

    path(
        "roles/",
        RoleListCreateAPIView.as_view(),
        name="role-list-create",
    ),

    path(
        "roles/<int:pk>/",
        RoleDetailAPIView.as_view(),
        name="role-detail",
    ),

    # --------------------------------------------------------
    # USER MANAGEMENT
    # --------------------------------------------------------

    path(
        "users/",
        OrganizationUserListCreateView.as_view(),
        name="organization-user-list-create",
    ),

    path(
        "users/<int:pk>/",
        OrganizationUserDetailView.as_view(),
        name="organization-user-detail",
    ),
]