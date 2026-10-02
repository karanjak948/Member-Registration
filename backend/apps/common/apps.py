from django.apps import AppConfig


class CommonConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.common"

    def ready(self):
        # Register reversal triggers
        try:
            import apps.common.triggers  # noqa: F401
        except Exception:
            pass
