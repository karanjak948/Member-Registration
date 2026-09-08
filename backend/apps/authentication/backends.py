from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

UserModel = get_user_model()


class EmailOrUsernameModelBackend(ModelBackend):
    """
    Authenticates against either a case-insensitive username
    or a case-insensitive email address.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)

        if not username or not password:
            return None

        clean_username = username.strip()

        try:
            user = (
                UserModel.objects
                .filter(
                    Q(username__iexact=clean_username) |
                    Q(email__iexact=clean_username)
                )
                .first()
            )

            if user and user.check_password(password) and self.user_can_authenticate(user):
                return user
        except Exception:
            return None

        return None
