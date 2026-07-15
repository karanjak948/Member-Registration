from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import LoginSerializer, UserSerializer
from .services import OAuthService


class HealthCheckView(APIView):
    """
    Simple endpoint to verify that the authentication app is running.
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
    Authenticate a user using OAuth2 Resource Owner Password Credentials.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        response_data, status_code = OAuthService.login(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )

        return Response(
            response_data,
            status=status_code,
        )
    
class CurrentUserView(APIView):
    """
    Returns the currently authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)

        return Response(serializer.data)
    
class LogoutView(APIView):

    def post(self, request):

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return Response(
                {"detail": "Authorization header missing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token = auth_header.replace("Bearer ", "")

        OAuthService.logout(token)

        return Response(
            {"message": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )
    
class RefreshTokenView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        refresh_token = request.data.get("refresh_token")

        if not refresh_token:
            return Response(
                {"error": "refresh_token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data, status_code = OAuthService.refresh(refresh_token)

        return Response(
            data,
            status=status_code,
        )