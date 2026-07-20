from rest_framework import status
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    UserSerializer,
)
from .services import OAuthService


class HealthCheckView(APIView):
    """
    Simple endpoint to verify that the
    authentication app is running.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "authentication",
            }
        )


class LoginView(APIView):
    """
    Authenticate a user using OAuth2 Resource
    Owner Password Credentials.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        response_data, status_code = (
            OAuthService.login(
                username=serializer.validated_data[
                    "username"
                ],
                password=serializer.validated_data[
                    "password"
                ],
            )
        )

        return Response(
            response_data,
            status=status_code,
        )


class CurrentUserView(APIView):
    """
    Retrieve and update the currently
    authenticated user's profile.
    """

    permission_classes = [
        IsAuthenticated
    ]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get(self, request):
        serializer = UserSerializer(
            request.user,
            context={
                "request": request
            },
        )

        return Response(
            serializer.data
        )

    def patch(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={
                "request": request
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    """
    Change the authenticated user's password.
    """

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):
        serializer = (
            ChangePasswordSerializer(
                data=request.data,
                context={
                    "request": request
                },
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = request.user

        user.set_password(
            serializer.validated_data[
                "new_password"
            ]
        )

        user.save(
            update_fields=[
                "password",
                "updated_at",
            ]
        )

        return Response(
            {
                "message":
                    "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):
        auth_header = request.headers.get(
            "Authorization"
        )

        if not auth_header:
            return Response(
                {
                    "detail":
                        "Authorization header missing."
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        token = auth_header.replace(
            "Bearer ",
            "",
        )

        OAuthService.logout(token)

        return Response(
            {
                "message":
                    "Logged out successfully."
            },
            status=status.HTTP_200_OK,
        )


class RefreshTokenView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        refresh_token = request.data.get(
            "refresh_token"
        )

        if not refresh_token:
            return Response(
                {
                    "error":
                        "refresh_token is required"
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        data, status_code = (
            OAuthService.refresh(
                refresh_token
            )
        )

        return Response(
            data,
            status=status_code,
        )