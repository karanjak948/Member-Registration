from django.db import models
from django.utils import timezone


class MpesaTransactionStatus(models.TextChoices):
    COMPLETED = "COMPLETED", "Completed & Allocated"
    UNALLOCATED = "UNALLOCATED", "Received (Unallocated)"
    FAILED = "FAILED", "Failed / Error"
    VERIFICATION_FAILED = "VERIFICATION_FAILED", "Relay Verification Failed"


class MpesaTransaction(models.Model):
    """
    Persists raw and processed Safaricom Daraja M-Pesa C2B Paybill transactions.
    Ensures idempotency via unique trans_id.
    """
    trans_id = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique M-Pesa Transaction ID (e.g. UIATRT7PD)",
    )
    transaction_type = models.CharField(
        max_length=50,
        default="Pay Bill",
        help_text="e.g. Pay Bill, Customer PayBill",
    )
    trans_time = models.DateTimeField(
        help_text="Transaction timestamp sent by Safaricom",
    )
    trans_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Amount received in KES",
    )
    business_short_code = models.CharField(
        max_length=20,
        help_text="Paybill or Till Number (e.g. 673649)",
    )
    bill_ref_number = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Account reference entered by customer (e.g. National ID or Loan #)",
    )
    invoice_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )
    org_account_balance = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Utility account balance after transaction",
    )
    third_party_trans_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )
    msisdn = models.CharField(
        max_length=30,
        help_text="Customer phone number (e.g. 254712345670)",
    )
    first_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Sender first name from Safaricom",
    )
    raw_payload = models.JSONField(
        help_text="Complete JSON payload received from Safaricom callback",
    )
    status = models.CharField(
        max_length=20,
        choices=MpesaTransactionStatus.choices,
        default=MpesaTransactionStatus.UNALLOCATED,
        db_index=True,
    )
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mpesa_payments",
    )
    loan = models.ForeignKey(
        "loans.Loan",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mpesa_payments",
    )
    repayment = models.ForeignKey(
        "loans.Repayment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mpesa_transactions",
    )
    error_message = models.TextField(
        blank=True,
        default="",
    )
    # Royal SACCO Payment Relay & Verification Handshake Tracking
    unique_serial = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        db_index=True,
        help_text="Unique relay batch or payment serial ID from system.royalltd.co.ke",
    )
    verify_url = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Verification endpoint URL called for confirmation handshake",
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="True if system.royalltd.co.ke verified this transaction",
    )
    verification_response = models.JSONField(
        null=True,
        blank=True,
        help_text="Raw payload returned by verification URL",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-trans_time", "-created_at"]
        verbose_name = "M-Pesa Transaction"
        verbose_name_plural = "M-Pesa Transactions"

    def __str__(self):
        return f"{self.trans_id} - KES {self.trans_amount} ({self.bill_ref_number}) [{self.status}]"


class MpesaReceivedPaymentStatus(models.TextChoices):
    RECEIVED = "received", "Received"
    VERIFIED = "verified", "Verified"
    PROCESSED = "processed", "Processed"
    FAILED = "failed", "Failed"


class MpesaReceivedPayment(models.Model):
    """
    Audit log of all incoming M-Pesa webhook calls on confirmation/validation endpoints.
    Maps directly to the database table mpesa_receivedmpesapayments.
    """
    unique_serial = models.IntegerField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Source mpesa_transactions id / unique serial",
    )
    mpesa_payload = models.TextField(
        null=True,
        blank=True,
        help_text="Full posted JSON",
    )
    transID = models.CharField(
        max_length=40,
        null=True,
        blank=True,
        db_index=True,
        help_text="M-Pesa TransID",
    )
    verify_url = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Source verification URL",
    )
    status = models.CharField(
        max_length=20,
        choices=MpesaReceivedPaymentStatus.choices,
        default=MpesaReceivedPaymentStatus.RECEIVED,
        help_text="Receive status",
    )
    message = models.TextField(
        null=True,
        blank=True,
        help_text="Processing or error message",
    )
    verification_response = models.TextField(
        null=True,
        blank=True,
        help_text="Callback verification response",
    )
    createdon = models.DateTimeField(
        default=timezone.now,
        help_text="Timestamp received",
    )
    ipaddress = models.CharField(
        max_length=45,
        null=True,
        blank=True,
        help_text="Client IP address",
    )

    class Meta:
        db_table = "mpesa_receivedmpesapayments"
        ordering = ["-createdon"]
        verbose_name = "Received M-Pesa Payment"
        verbose_name_plural = "Received M-Pesa Payments"

    def __str__(self):
        return f"[{self.status}] {self.transID or self.unique_serial or self.id} ({self.createdon})"

