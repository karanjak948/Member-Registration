from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("members", "0013_alter_smslog_event_type"),
    ]

    operations = [
        migrations.AlterField(
            model_name="smslog",
            name="event_type",
            field=models.CharField(
                choices=[
                    ("bulk_broadcast", "Bulk Broadcast"),
                    ("loan_application", "Loan Application"),
                    ("loan_appraisal", "Loan Appraisal"),
                    ("loan_approval", "Loan Approval"),
                    ("loan_rejection", "Loan Rejection"),
                    ("loan_disbursement", "Loan Disbursement"),
                    ("repayment_confirmation", "Repayment Confirmation"),
                    ("due_date_reminder", "Due Date Reminder"),
                    ("overdue_alert", "Overdue Delinquency Alert"),
                    ("loan_completion", "Loan Completion"),
                    ("welcome", "Welcome Registration"),
                    ("mpesa_payment_received", "M-Pesa Payment Received"),
                    ("general", "General Notification"),
                ],
                db_index=True,
                default="bulk_broadcast",
                max_length=50,
            ),
        ),
    ]
