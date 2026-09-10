from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('loans', '0003_loan_approval_date_loan_approved_amount_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='loan',
            name='loan_officer',
            field=models.ForeignKey(
                blank=True,
                help_text='Assigned Loan Officer portfolio owner',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='managed_loans',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
