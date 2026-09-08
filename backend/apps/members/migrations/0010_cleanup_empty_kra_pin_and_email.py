from django.db import migrations


def cleanup_empty_strings(apps, schema_editor):
    Member = apps.get_model("members", "Member")
    # Convert empty strings to NULL in MySQL
    Member.objects.filter(kra_pin="").update(kra_pin=None)
    Member.objects.filter(email="").update(email=None)


def reverse_cleanup(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("members", "0009_smslog"),
    ]

    operations = [
        migrations.RunPython(cleanup_empty_strings, reverse_cleanup),
    ]
