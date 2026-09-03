from django.test import TestCase
from django.contrib.auth import get_user_model, authenticate
from apps.organizations.models import Organization, OrganizationUser, Role
from apps.organizations.serializers import OrganizationUserUpdateSerializer

User = get_user_model()


class OrganizationUserPasswordResetTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="testowner",
            email="owner@example.com",
            password="InitialOwnerPass123!",
        )
        self.org = Organization.objects.create(
            name="Test SACCO",
            code="TSACCO",
            owner=self.owner,
        )
        self.role = Role.objects.create(
            name="Staff",
            organization=self.org,
        )
        self.staff_user = User.objects.create_user(
            username="teststaff",
            email="staff@example.com",
            password="OldPassword123!",
        )
        self.membership = OrganizationUser.objects.create(
            organization=self.org,
            user=self.staff_user,
            role=self.role,
            is_active=True,
        )

    def test_reset_password_via_serializer(self):
        new_password = "BrandNewPassword789!"
        serializer = OrganizationUserUpdateSerializer(
            self.membership,
            data={"password": new_password},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        self.staff_user.refresh_from_db()

        # Check authentication with old password fails
        self.assertIsNone(
            authenticate(username="teststaff", password="OldPassword123!")
        )

        # Check authentication with new password succeeds
        user_auth = authenticate(username="teststaff", password=new_password)
        self.assertIsNotNone(user_auth)
        self.assertEqual(user_auth.id, self.staff_user.id)
