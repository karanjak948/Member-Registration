from django.urls import path

from .views import (
    ChangePasswordView,
    CurrentUserView,
    ForgotPasswordView,
    HealthCheckView,
    LoginView,
    LogoutView,
    RefreshTokenView,
    RegisterView,
    ResetPasswordView,
    VerifyResetOTPView,
)


urlpatterns = [
    path(
        "health/",
        HealthCheckView.as_view(),
        name="auth-health",
    ),

    path(
        "register/",
        RegisterView.as_view(),
        name="auth-register",
    ),

    path(
        "login/",
        LoginView.as_view(),
        name="auth-login",
    ),

    # --------------------------------------------------------
    # PASSWORD RECOVERY
    # --------------------------------------------------------

    path(
        "forgot-password/",
        ForgotPasswordView.as_view(),
        name="auth-forgot-password",
    ),

    path(
        "verify-reset-otp/",
        VerifyResetOTPView.as_view(),
        name="auth-verify-reset-otp",
    ),

    path(
        "reset-password/",
        ResetPasswordView.as_view(),
        name="auth-reset-password",
    ),

    # --------------------------------------------------------
    # AUTHENTICATED ACCOUNT
    # --------------------------------------------------------

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