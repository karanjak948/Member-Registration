from django.db import migrations


def backfill_member_organizations(apps, schema_editor):
    """
    Assign existing Member records to the organization
    associated with the user who originally created them.

    Historical models are used deliberately so this migration
    remains reproducible even if application models change.
    """

    Member = apps.get_model(
        "members",
        "Member",
    )

    Organization = apps.get_model(
        "organizations",
        "Organization",
    )

    OrganizationUser = apps.get_model(
        "organizations",
        "OrganizationUser",
    )

    for member in Member.objects.filter(
        organization__isnull=True
    ).iterator():

        if member.created_by_id is None:
            continue

        # Preferred source:
        # active organization membership created by RBAC.
        membership = (
            OrganizationUser.objects
            .filter(
                user_id=member.created_by_id,
                is_active=True,
            )
            .order_by("id")
            .first()
        )

        if membership is not None:
            member.organization_id = (
                membership.organization_id
            )

            member.save(
                update_fields=[
                    "organization",
                ]
            )

            continue

        # Backward-compatible fallback for organizations
        # owned directly by users before RBAC was introduced.
        organization = (
            Organization.objects
            .filter(
                owner_id=member.created_by_id
            )
            .order_by("id")
            .first()
        )

        if organization is not None:
            member.organization_id = (
                organization.id
            )

            member.save(
                update_fields=[
                    "organization",
                ]
            )


def reverse_backfill_member_organizations(
    apps,
    schema_editor,
):
    """
    Reverse only the data populated by this migration.

    At this migration point organization is still nullable.
    """

    Member = apps.get_model(
        "members",
        "Member",
    )

    Member.objects.update(
        organization=None
    )


class Migration(migrations.Migration):

    dependencies = [
        (
            "members",
            "0002_member_organization",
        ),
    ]

    operations = [
        migrations.RunPython(
            backfill_member_organizations,
            reverse_backfill_member_organizations,
        ),
    ]