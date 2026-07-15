import os

import requests


class OAuthService:
    """
    Handles communication with Django OAuth Toolkit.
    """

    @staticmethod
    def login(username: str, password: str):
        """
        Exchange username and password for an OAuth access token.
        """

        token_url = f"{os.getenv('API_BASE_URL')}/o/token/"

        payload = {
            "grant_type": "password",
            "username": username,
            "password": password,
            "client_id": os.getenv("OAUTH_CLIENT_ID"),
            "client_secret": os.getenv("OAUTH_CLIENT_SECRET"),
        }

        response = requests.post(
            token_url,
            data=payload,
        )

        return response.json(), response.status_code
    
    @staticmethod
    def logout(token: str):
        """
        Revoke an OAuth access token.
        """

        revoke_url = f"{os.getenv('API_BASE_URL')}/o/revoke_token/"

        payload = {
            "token": token,
            "client_id": os.getenv("OAUTH_CLIENT_ID"),
            "client_secret": os.getenv("OAUTH_CLIENT_SECRET"),
        }

        response = requests.post(
            revoke_url,
            data=payload,
        )

        return response.status_code
    
    @staticmethod
    def refresh(refresh_token: str):
        """
        Exchange a refresh token for a new access token.
        """

        token_url = f"{os.getenv('API_BASE_URL')}/o/token/"

        payload = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": os.getenv("OAUTH_CLIENT_ID"),
            "client_secret": os.getenv("OAUTH_CLIENT_SECRET"),
        }

        response = requests.post(
            token_url,
            data=payload,
        )

        return response.json(), response.status_code