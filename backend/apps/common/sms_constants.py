from django.db import models


class SMSEventType(models.TextChoices):
    BULK_BROADCAST = "bulk_broadcast", "Bulk Broadcast"
    LOAN_APPLICATION = "loan_application", "Loan Application"
    LOAN_APPROVAL = "loan_approval", "Loan Approval"
    LOAN_DISBURSEMENT = "loan_disbursement", "Loan Disbursement"
    REPAYMENT_CONFIRMATION = "repayment_confirmation", "Repayment Confirmation"
    DUE_DATE_REMINDER = "due_date_reminder", "Due Date Reminder"
    OVERDUE_ALERT = "overdue_alert", "Overdue Delinquency Alert"
    LOAN_COMPLETION = "loan_completion", "Loan Completion"
    WELCOME = "welcome", "Welcome Registration"
    GENERAL = "general", "General Notification"


class SMSDeliveryStatus(models.TextChoices):
    SENT = "sent", "Sent"
    FAILED = "failed", "Failed"
    PENDING = "pending", "Pending"
