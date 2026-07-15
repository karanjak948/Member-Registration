from django.urls import path

from .views import (
    HealthCheckView,
    LoginView,
    CurrentUserView,
    LogoutView,
    RefreshTokenView,
)

urlpatterns = [
    path("health/", HealthCheckView.as_view()),
    path("login/", LoginView.as_view()),
    path("me/", CurrentUserView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("refresh/", RefreshTokenView.as_view()),
]