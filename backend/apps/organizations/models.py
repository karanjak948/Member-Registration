from django.conf import settings
from django.db import models


class Organization(models.Model):
    """
    Organization/workspace owned by an application user.

    Each user has at most one organization. Organization
    data is isolated from every other user's workspace.
    """

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization",
    )

    name = models.CharField(
        max_length=200,
    )

    code = models.CharField(
        max_length=30,
        unique=True,
    )

    email = models.EmailField()

    phone_number = models.CharField(
        max_length=30,
    )

    physical_address = models.TextField()

    website = models.URLField(
        blank=True,
    )

    logo = models.ImageField(
        upload_to="organizations/logos/",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.owner})"