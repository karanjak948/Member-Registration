from django.urls import path

from .views import (
    ChangePasswordView,
    CurrentUserView,
    HealthCheckView,
    LoginView,
    LogoutView,
    RefreshTokenView,
)


urlpatterns = [
    path(
        "health/",
        HealthCheckView.as_view(),
        name="auth-health",
    ),

    path(
        "login/",
        LoginView.as_view(),
        name="auth-login",
    ),

    path(
        "me/",
        CurrentUserView.as_view(),
        name="auth-me",
    ),

    path(
        "change-password/",
        ChangePasswordView.as_view(),
        name="auth-change-password",
    ),

    path(
        "logout/",
        LogoutView.as_view(),
        name="auth-logout",
    ),

    path(
        "refresh/",
        RefreshTokenView.as_view(),
        name="auth-refresh",
    ),
]