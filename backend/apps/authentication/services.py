import os

import requests


class OAuthService:
    """
    Handles communication with Django OAuth Toolkit.
    """

    @staticmethod
    def _get_base_url():
        return (os.getenv("API_BASE_URL") or "http://127.0.0.1:8000").rstrip("/")

    @staticmethod
    def login(username: str, password: str):
        """
        Exchange username and password for an OAuth access token.
        """
        base_url = OAuthService._get_base_url()
        token_url = f"{base_url}/o/token/"

        payload = {
            "grant_type": "password",
            "username": username,
            "password": password,
            "client_id": os.getenv("OAUTH_CLIENT_ID"),
            "client_secret": os.getenv("OAUTH_CLIENT_SECRET"),
        }

        try:
            response = requests.post(
                token_url,
                data=payload,
                timeout=10,
            )
            return response.json(), response.status_code
        except requests.exceptions.JSONDecodeError:
            return {
                "error": "invalid_response",
                "error_description": f"OAuth server returned non-JSON response (Status: {response.status_code})"
            }, response.status_code or 500
        except Exception as e:
            return {
                "error": "server_error",
                "error_description": str(e)
            }, 500
    
    @staticmethod
    def logout(token: str):
        """
        Revoke an OAuth access token.
        """
        base_url = OAuthService._get_base_url()
        revoke_url = f"{base_url}/o/revoke_token/"

        payload = {
            "token": token,
            "client_id": os.getenv("OAUTH_CLIENT_ID"),
            "client_secret": os.getenv("OAUTH_CLIENT_SECRET"),
        }

        try:
            response = requests.post(
                revoke_url,
                data=payload,
                timeout=10,
            )
            return response.status_code
        except Exception:
            return 500
    
    @staticmethod
    def refresh(refresh_token: str):
        """
        Exchange a refresh token for a new access token.
        """
        base_url = OAuthService._get_base_url()
        token_url = f"{base_url}/o/token/"

        payload = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": os.getenv("OAUTH_CLIENT_ID"),
            "client_secret": os.getenv("OAUTH_CLIENT_SECRET"),
        }

        try:
            response = requests.post(
                token_url,
                data=payload,
                timeout=10,
            )
            return response.json(), response.status_code
        except requests.exceptions.JSONDecodeError:
            return {
                "error": "invalid_response",
                "error_description": f"OAuth server returned non-JSON response (Status: {response.status_code})"
            }, response.status_code or 500
        except Exception as e:
            return {
                "error": "server_error",
                "error_description": str(e)
            }, 500