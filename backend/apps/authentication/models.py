from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """
    Custom application user used for authentication
    and account profiles.
    """

    profile_photo = models.ImageField(
        upload_to="profile_photos/",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.username


class PasswordResetOTP(models.Model):
    """
    Stores short-lived password-reset OTP challenges.

    Security design:
    - The raw OTP is never stored.
    - OTPs expire after a short period.
    - Verification attempts are limited.
    - Successful challenges are marked as used.
    - Previous active challenges can be invalidated
      when a new OTP is requested.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_otps",
    )

    otp_hash = models.CharField(
        max_length=128,
    )

    expires_at = models.DateTimeField()

    attempts = models.PositiveSmallIntegerField(
        default=0,
    )

    used_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "user",
                    "created_at",
                ],
                name="auth_otp_user_created_idx",
            ),
            models.Index(
                fields=[
                    "expires_at",
                ],
                name="auth_otp_expires_idx",
            ),
        ]

    def __str__(self):
        return (
            f"Password reset OTP for "
            f"{self.user.username}"
        )

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @property
    def is_used(self):
        return self.used_at is not None

    @property
    def is_active(self):
        return (
            not self.is_used
            and not self.is_expired
        )