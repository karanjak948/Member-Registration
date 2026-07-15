from django.db import models


class MemberConfiguration(models.Model):
    """
    Global configuration for member onboarding.
    """

    show_next_of_kin = models.BooleanField(default=True)

    show_vehicle = models.BooleanField(default=True)

    show_guarantor = models.BooleanField(default=True)

    show_kra_pin = models.BooleanField(default=True)

    require_phone = models.BooleanField(default=True)

    require_national_id = models.BooleanField(default=True)

    require_passport_photo = models.BooleanField(default=False)

    require_vehicle = models.BooleanField(default=False)

    require_next_of_kin = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tbl_member_configuration"

        verbose_name = "Member Configuration"
        verbose_name_plural = "Member Configuration"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return "Member Configuration"