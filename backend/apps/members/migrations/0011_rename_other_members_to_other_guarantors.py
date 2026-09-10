from django.db import migrations


def rename_other_members(apps, schema_editor):
    MemberCategory = apps.get_model("members", "MemberCategory")
    MemberCategory.objects.filter(code="OTHER").update(
        name="Other Guarantors",
        description="Other Guarantors (part of membership)",
    )


def reverse_rename(apps, schema_editor):
    MemberCategory = apps.get_model("members", "MemberCategory")
    MemberCategory.objects.filter(code="OTHER").update(
        name="Other Member",
        description="Other member",
    )


class Migration(migrations.Migration):

    dependencies = [
        ("members", "0010_cleanup_empty_kra_pin_and_email"),
    ]

    operations = [
        migrations.RunPython(rename_other_members, reverse_rename),
    ]
