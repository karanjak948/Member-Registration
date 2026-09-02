import os
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate
from django.conf import settings
from oauth2_provider.models import (
    get_application_model,
    get_access_token_model,
    get_refresh_token_model,
)
from oauthlib.common import generate_token


class OAuthService:
    """
    Handles authentication and OAuth2 token management natively.
    Generates tokens directly via Django OAuth Toolkit models, preventing
    deadlocks and network issues caused by synchronous HTTP loopbacks.
    """

    @staticmethod
    def _get_application():
        Application = get_application_model()
        client_id = os.getenv("OAUTH_CLIENT_ID")
        if client_id:
            app = Application.objects.filter(client_id=client_id).first()
            if app:
                return app
        return Application.objects.first()

    @staticmethod
    def login(username: str, password: str):
        """
        Authenticate username and password and issue an OAuth2 access token.
        """
        user = authenticate(username=username, password=password)
        if not user:
            return {
                "error": "invalid_grant",
                "error_description": "Invalid username or password.",
            }, 401

        if not user.is_active:
            return {
                "error": "user_inactive",
                "error_description": "This user account is inactive.",
            }, 403

        app = OAuthService._get_application()
        if not app:
            return {
                "error": "server_error",
                "error_description": "OAuth application configuration not found.",
            }, 500

        AccessToken = get_access_token_model()
        RefreshToken = get_refresh_token_model()

        expires_in = getattr(settings, "OAUTH2_PROVIDER", {}).get("ACCESS_TOKEN_EXPIRE_SECONDS", 3600)
        expires = timezone.now() + timedelta(seconds=expires_in)

        access_token = AccessToken.objects.create(
            user=user,
            application=app,
            token=generate_token(),
            expires=expires,
            scope="read write",
        )

        refresh_token = RefreshToken.objects.create(
            user=user,
            application=app,
            token=generate_token(),
            access_token=access_token,
        )

        return {
            "access_token": access_token.token,
            "expires_in": expires_in,
            "token_type": "Bearer",
            "scope": access_token.scope,
            "refresh_token": refresh_token.token,
        }, 200

    @staticmethod
    def logout(token: str):
        """
        Revoke an OAuth access token.
        """
        AccessToken = get_access_token_model()
        deleted_count, _ = AccessToken.objects.filter(token=token).delete()
        return 200 if deleted_count > 0 else 404

    @staticmethod
    def refresh(refresh_token_str: str):
        """
        Exchange a refresh token for a new access token.
        """
        RefreshToken = get_refresh_token_model()
        AccessToken = get_access_token_model()

        refresh_token = RefreshToken.objects.filter(token=refresh_token_str).select_related("user", "application").first()
        if not refresh_token:
            return {
                "error": "invalid_grant",
                "error_description": "Invalid or expired refresh token.",
            }, 400

        user = refresh_token.user
        app = refresh_token.application

        expires_in = getattr(settings, "OAUTH2_PROVIDER", {}).get("ACCESS_TOKEN_EXPIRE_SECONDS", 3600)
        expires = timezone.now() + timedelta(seconds=expires_in)

        new_access_token = AccessToken.objects.create(
            user=user,
            application=app,
            token=generate_token(),
            expires=expires,
            scope="read write",
        )

        new_refresh_token = RefreshToken.objects.create(
            user=user,
            application=app,
            token=generate_token(),
            access_token=new_access_token,
        )

        # Delete old tokens
        if refresh_token.access_token:
            refresh_token.access_token.delete()
        refresh_token.delete()

        return {
            "access_token": new_access_token.token,
            "expires_in": expires_in,
            "token_type": "Bearer",
            "scope": new_access_token.scope,
            "refresh_token": new_refresh_token.token,
        }, 200