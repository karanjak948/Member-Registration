from django.core.exceptions import ValidationError
from django.db import models


class Organization(models.Model):
    """
    Singleton model representing the organization using the system.
    Only one Organization record should ever exist.
    """

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
        upload_to="organization/",
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
        verbose_name_plural = "Organization"

    def clean(self):
        """
        Prevent creation of more than one organization.
        """
        if (
            not self.pk
            and Organization.objects.exists()
        ):
            raise ValidationError(
                "Only one organization can exist."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name