from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization
from apps.members.models import Member
from apps.members.serializers import MemberSerializer

User = get_user_model()


class MemberRegistrationAndSearchTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testadmin",
            email="admin@sacco.test",
            password="Password123!",
        )
        self.org = Organization.objects.create(
            name="Alpha SACCO",
            code="ALPHA",
            owner=self.user,
        )

    def test_create_multiple_members_with_blank_kra_pin(self):
        """
        Ensure that multiple members can be created with empty string,
        spaces, or None for kra_pin without IntegrityError duplicate key collisions.
        """
        member1 = Member.objects.create(
            first_name="John",
            other_names="Doe",
            national_id="ID10001",
            phone_number="0711000001",
            organization=self.org,
            kra_pin="",
            email="",
        )
        self.assertIsNone(member1.kra_pin)
        self.assertIsNone(member1.email)

        member2 = Member.objects.create(
            first_name="Jane",
            other_names="Smith",
            national_id="ID10002",
            phone_number="0711000002",
            organization=self.org,
            kra_pin="   ",
            email="   ",
        )
        self.assertIsNone(member2.kra_pin)
        self.assertIsNone(member2.email)

        member3 = Member.objects.create(
            first_name="Peter",
            other_names="Irungu",
            national_id="ID10003",
            phone_number="0711000003",
            organization=self.org,
            kra_pin=None,
            email=None,
        )
        self.assertIsNone(member3.kra_pin)
        self.assertIsNone(member3.email)

        # Check that unique KRA PINs are stored properly in uppercase
        member4 = Member.objects.create(
            first_name="Alice",
            other_names="Wanjiku",
            national_id="ID10004",
            phone_number="0711000004",
            organization=self.org,
            kra_pin="a012345678z",
            email="alice@sacco.test",
        )
        self.assertEqual(member4.kra_pin, "A012345678Z")
        self.assertEqual(member4.email, "alice@sacco.test")

    def test_member_serializer_validation_of_blank_kra_pin(self):
        """
        Test that MemberSerializer sanitizes empty strings to None before save.
        """
        data = {
            "first_name": "Bob",
            "other_names": "Mwangi",
            "national_id": "ID20001",
            "phone_number": "0722000001",
            "kra_pin": "",
            "email": "",
            "organization": self.org.id,
        }
        serializer = MemberSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data.get("kra_pin"))
        self.assertIsNone(serializer.validated_data.get("email"))
