import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import (
    check_password,
    make_password,
)
from django.contrib.auth.password_validation import (
    validate_password,
)
from django.core import signing
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

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

from .models import (
    PasswordResetOTP,
    User,
)
from .serializers import (
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
    VerifyResetOTPSerializer,
)
from .services import OAuthService


# ============================================================
# PASSWORD RESET CONFIGURATION
# ============================================================

OTP_EXPIRY_MINUTES = 10

OTP_MAX_ATTEMPTS = 5

OTP_RESEND_COOLDOWN_SECONDS = 60

RESET_TOKEN_MAX_AGE_SECONDS = 10 * 60

RESET_TOKEN_SALT = (
    "authentication.password-reset"
)


# ============================================================
# HEALTH CHECK
# ============================================================

class HealthCheckView(APIView):
    """
    Verify that the authentication application
    is available.
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


# ============================================================
# LOGIN
# ============================================================

class LoginView(APIView):
    """
    Authenticate a user using the existing
    OAuth2 authentication service.
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


# ============================================================
# REGISTER
# ============================================================

class RegisterView(APIView):
    """
    Create a standard application user.

    Public registration cannot create staff
    or superuser accounts.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        return Response(
            {
                "message":
                    "Account created successfully.",

                "user": UserSerializer(
                    user,
                    context={
                        "request": request
                    },
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# CURRENT USER
# ============================================================

class CurrentUserView(APIView):
    """
    Retrieve or update the authenticated
    user's profile.
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


# ============================================================
# AUTHENTICATED PASSWORD CHANGE
# ============================================================

class ChangePasswordView(APIView):
    """
    Change the password for an already
    authenticated user.

    This is separate from forgotten-password
    recovery and requires the current password.
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


# ============================================================
# LOGOUT
# ============================================================

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


# ============================================================
# REFRESH TOKEN
# ============================================================

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


# ============================================================
# FORGOT PASSWORD — STAGE 1
# ============================================================

class ForgotPasswordView(APIView):
    """
    Request a six-digit password-reset OTP.

    Security properties:

    - Does not reveal whether an email exists.
    - Raw OTP is never stored in the database.
    - OTP expires after a short period.
    - Resend requests are rate-limited per account.
    - Previous unused OTPs are invalidated when
      a new OTP is successfully issued.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = ForgotPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        email = serializer.validated_data[
            "email"
        ]

        generic_response = {
            "message": (
                "If an active account exists for "
                "that email address, a verification "
                "code has been sent."
            )
        }

        user = (
            User.objects
            .filter(
                email__iexact=email,
                is_active=True,
            )
            .first()
        )

        # Never disclose whether the account exists.
        if not user:
            return Response(
                generic_response,
                status=status.HTTP_200_OK,
            )

        now = timezone.now()

        latest_otp = (
            PasswordResetOTP.objects
            .filter(
                user=user,
            )
            .order_by(
                "-created_at"
            )
            .first()
        )

        # Prevent repeated OTP generation/email abuse.
        if latest_otp:
            cooldown_until = (
                latest_otp.created_at
                + timedelta(
                    seconds=(
                        OTP_RESEND_COOLDOWN_SECONDS
                    )
                )
            )

            if now < cooldown_until:
                # Deliberately return the same outward
                # response rather than exposing account
                # state or cooldown details.
                return Response(
                    generic_response,
                    status=status.HTTP_200_OK,
                )

        # secrets.randbelow() uses a cryptographically
        # secure random source.
        otp = (
            f"{secrets.randbelow(1_000_000):06d}"
        )

        otp_hash = make_password(
            otp
        )

        expires_at = (
            now
            + timedelta(
                minutes=OTP_EXPIRY_MINUTES
            )
        )

        with transaction.atomic():
            # Invalidate any older unused OTPs.
            PasswordResetOTP.objects.filter(
                user=user,
                used_at__isnull=True,
            ).update(
                used_at=now
            )

            PasswordResetOTP.objects.create(
                user=user,
                otp_hash=otp_hash,
                expires_at=expires_at,
            )

        try:
            send_mail(
                subject=(
                    "Your password reset "
                    "verification code"
                ),
                message=(
                    "A password reset was requested "
                    "for your Member Registration "
                    "System account.\n\n"

                    "Your verification code is:\n\n"

                    f"{otp}\n\n"

                    f"This code expires in "
                    f"{OTP_EXPIRY_MINUTES} minutes.\n\n"

                    "If you did not request this "
                    "password reset, you can ignore "
                    "this message."
                ),
                from_email=getattr(
                    settings,
                    "DEFAULT_FROM_EMAIL",
                    None,
                ),
                recipient_list=[
                    user.email
                ],
                fail_silently=False,
            )

        except Exception:
            # If email delivery fails, invalidate the
            # OTP that was just created. This prevents
            # an undelivered code from remaining valid.
            PasswordResetOTP.objects.filter(
                user=user,
                used_at__isnull=True,
            ).update(
                used_at=timezone.now()
            )

            raise

        return Response(
            generic_response,
            status=status.HTTP_200_OK,
        )


# ============================================================
# VERIFY OTP — STAGE 2
# ============================================================

class VerifyResetOTPView(APIView):
    """
    Verify a password-reset OTP.

    A successful verification consumes the OTP
    and returns a short-lived signed authorization
    token.

    The signed token, not the OTP itself, authorizes
    the final password reset.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = (
            VerifyResetOTPSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        email = serializer.validated_data[
            "email"
        ]

        submitted_otp = (
            serializer.validated_data[
                "otp"
            ]
        )

        user = (
            User.objects
            .filter(
                email__iexact=email,
                is_active=True,
            )
            .first()
        )

        invalid_response = {
            "detail": (
                "The verification code is invalid "
                "or has expired."
            )
        }

        if not user:
            return Response(
                invalid_response,
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        with transaction.atomic():
            otp_record = (
                PasswordResetOTP.objects
                .select_for_update()
                .filter(
                    user=user,
                    used_at__isnull=True,
                )
                .order_by(
                    "-created_at"
                )
                .first()
            )

            if not otp_record:
                return Response(
                    invalid_response,
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            if (
                otp_record.expires_at
                <= now
            ):
                otp_record.used_at = now

                otp_record.save(
                    update_fields=[
                        "used_at",
                    ]
                )

                return Response(
                    invalid_response,
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            if (
                otp_record.attempts
                >= OTP_MAX_ATTEMPTS
            ):
                otp_record.used_at = now

                otp_record.save(
                    update_fields=[
                        "used_at",
                    ]
                )

                return Response(
                    invalid_response,
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            if not check_password(
                submitted_otp,
                otp_record.otp_hash,
            ):
                otp_record.attempts += 1

                update_fields = [
                    "attempts",
                ]

                if (
                    otp_record.attempts
                    >= OTP_MAX_ATTEMPTS
                ):
                    otp_record.used_at = now

                    update_fields.append(
                        "used_at"
                    )

                otp_record.save(
                    update_fields=update_fields
                )

                return Response(
                    invalid_response,
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            # OTP is valid and becomes unusable
            # immediately.
            otp_record.used_at = now

            otp_record.save(
                update_fields=[
                    "used_at",
                ]
            )

        # Include the current password hash in the
        # signed payload. If the password changes
        # before this token is used, the token is
        # automatically rejected.
        reset_token = signing.dumps(
            {
                "user_id": user.pk,

                "password_fingerprint":
                    user.password,
            },
            salt=RESET_TOKEN_SALT,
            compress=True,
        )

        return Response(
            {
                "message":
                    "Verification code accepted.",

                "reset_token":
                    reset_token,

                "expires_in":
                    RESET_TOKEN_MAX_AGE_SECONDS,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# RESET PASSWORD — STAGE 3
# ============================================================

class ResetPasswordView(APIView):
    """
    Reset a password using the short-lived
    authorization token issued after successful
    OTP verification.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = ResetPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        reset_token = (
            serializer.validated_data[
                "reset_token"
            ]
        )

        try:
            payload = signing.loads(
                reset_token,
                salt=RESET_TOKEN_SALT,
                max_age=(
                    RESET_TOKEN_MAX_AGE_SECONDS
                ),
            )

        except (
            signing.BadSignature,
            signing.SignatureExpired,
        ):
            return Response(
                {
                    "reset_token": [
                        "This password reset "
                        "authorization is invalid "
                        "or has expired."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_id = payload.get(
            "user_id"
        )

        password_fingerprint = (
            payload.get(
                "password_fingerprint"
            )
        )

        if (
            not user_id
            or not password_fingerprint
        ):
            return Response(
                {
                    "reset_token": [
                        "This password reset "
                        "authorization is invalid "
                        "or has expired."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = (
            User.objects
            .filter(
                pk=user_id,
                is_active=True,
            )
            .first()
        )

        if not user:
            return Response(
                {
                    "reset_token": [
                        "This password reset "
                        "authorization is invalid "
                        "or has expired."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Makes the reset authorization effectively
        # one-use: after set_password(), user.password
        # changes and replaying this token fails.
        if (
            user.password
            != password_fingerprint
        ):
            return Response(
                {
                    "reset_token": [
                        "This password reset "
                        "authorization has already "
                        "been used or is no longer "
                        "valid."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_password = (
            serializer.validated_data[
                "new_password"
            ]
        )

        # Do not permit resetting to the exact
        # current password.
        if user.check_password(
            new_password
        ):
            return Response(
                {
                    "new_password": [
                        "New password must be "
                        "different from the current "
                        "password."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(
                new_password,
                user=user,
            )

        except ValidationError as exc:
            return Response(
                {
                    "new_password":
                        list(exc.messages)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(
            new_password
        )

        user.save(
            update_fields=[
                "password",
                "updated_at",
            ]
        )

        # Invalidate any remaining password-reset
        # challenges for this account.
        PasswordResetOTP.objects.filter(
            user=user,
            used_at__isnull=True,
        ).update(
            used_at=timezone.now()
        )

        return Response(
            {
                "message": (
                    "Password reset successfully. "
                    "You can now sign in using your "
                    "new password."
                )
            },
            status=status.HTTP_200_OK,
        )