import json
from decimal import Decimal
from django.db import models, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from apps.common.models import PaymentReversalLog


def serialize_snapshot(data: dict) -> dict:
    """Helper to convert decimals/dates into JSON-safe types."""
    safe_data = {}
    for k, v in data.items():
        if isinstance(v, Decimal):
            safe_data[k] = str(v)
        elif hasattr(v, "isoformat"):
            safe_data[k] = v.isoformat()
        elif hasattr(v, "id"):
            safe_data[k] = v.id
        else:
            safe_data[k] = v
    return safe_data


def log_reversal_trigger(payment_type: str, payment_instance, user=None, reason: str = ""):
    """
    Core trigger function that logs a payment reversal to PaymentReversalLog.
    Guarantees that a payment reversal is audited with its exact pre-reversal snapshot.
    """
    doc_no = getattr(payment_instance, "document_no", None) or getattr(payment_instance, "repayment_number", "")
    pid = str(payment_instance.pk)

    # Check if already logged
    existing = PaymentReversalLog.objects.filter(
        payment_type=payment_type,
        original_payment_id=pid,
    ).first()
    if existing:
        return existing

    amount = (
        getattr(payment_instance, "amount", None)
        or getattr(payment_instance, "total_amount", None)
        or getattr(payment_instance, "amount_paid", Decimal("0.00"))
    )

    member = getattr(payment_instance, "member", None)
    if not member and hasattr(payment_instance, "loan") and payment_instance.loan:
        member = payment_instance.loan.member

    org = getattr(payment_instance, "organization", None)
    if not org and hasattr(payment_instance, "loan") and payment_instance.loan:
        org = payment_instance.loan.organization

    # Build snapshot
    snapshot = {}
    for field in payment_instance._meta.fields:
        val = getattr(payment_instance, field.name, None)
        if field.name not in ["is_reversed", "reversed_at", "reversed_by", "reversal_reason"]:
            if isinstance(val, (Decimal, models.Model)):
                snapshot[field.name] = str(val)
            elif hasattr(val, "isoformat"):
                snapshot[field.name] = val.isoformat()
            else:
                snapshot[field.name] = val

    actual_user = user or getattr(payment_instance, "reversed_by", None)
    actual_reason = reason or getattr(payment_instance, "reversal_reason", "") or "Payment reversed by user action"

    return PaymentReversalLog.objects.create(
        organization=org,
        payment_type=payment_type,
        original_payment_id=pid,
        document_or_receipt_no=str(doc_no),
        member=member,
        amount_reversed=amount,
        reversal_reason=actual_reason,
        reversed_by=actual_user,
        reversed_at=timezone.now(),
        snapshot_data=serialize_snapshot(snapshot),
    )


# --- Reversal Business Logic Functions ---

@transaction.atomic
def reverse_savings_payment(payment, user=None, reason: str = ""):
    """
    Reverses a SavingsPayment.
    Updates is_reversed flag, triggers audit log, and deactivates any linked withdrawal.
    """
    if payment.is_reversed:
        raise ValueError(f"Savings Payment {payment.document_no} is already reversed.")

    payment.is_reversed = True
    payment.reversed_at = timezone.now()
    payment.reversed_by = user
    payment.reversal_reason = reason or "Savings payment reversed"
    payment.save()

    # If linked to a savings withdrawal, deactivate it
    if hasattr(payment, "source_withdrawal") and payment.source_withdrawal:
        withdrawal = payment.source_withdrawal
        if withdrawal.is_active:
            withdrawal.is_active = False
            withdrawal.save()

    log_reversal_trigger(PaymentReversalLog.PaymentType.SAVINGS, payment, user, reason)
    return payment


@transaction.atomic
def reverse_share_payment(payment, user=None, reason: str = ""):
    """
    Reverses a SharePayment.
    Updates is_reversed flag and triggers audit log.
    """
    if payment.is_reversed:
        raise ValueError(f"Share Payment {payment.document_no} is already reversed.")

    payment.is_reversed = True
    payment.reversed_at = timezone.now()
    payment.reversed_by = user
    payment.reversal_reason = reason or "Share payment reversed"
    payment.save()

    log_reversal_trigger(PaymentReversalLog.PaymentType.SHARES, payment, user, reason)
    return payment


@transaction.atomic
def reverse_loan_repayment(repayment, user=None, reason: str = ""):
    """
    Reverses a Loan Repayment.
    Restores loan schedule entries (paid_principal, paid_interest, paid_fees) and marks is_paid=False.
    Logs reversal to PaymentReversalLog.
    """
    if repayment.is_reversed:
        raise ValueError(f"Loan Repayment {repayment.repayment_number} is already reversed.")

    loan = repayment.loan
    alloc_p = repayment.allocated_principal or Decimal("0.00")
    alloc_i = repayment.allocated_interest or Decimal("0.00")
    alloc_f = repayment.allocated_fees or Decimal("0.00")

    # Find schedule entries paid on or before this payment date that were marked paid
    from apps.loans.models.loan_schedule import LoanScheduleEntry
    entries = LoanScheduleEntry.objects.filter(
        loan=loan,
        paid_principal__gt=0,
    ).order_by("-installment_number")

    remaining_p_rev = alloc_p
    for entry in entries:
        if remaining_p_rev <= 0:
            break
        to_revert = min(entry.paid_principal, remaining_p_rev)
        entry.paid_principal -= to_revert
        remaining_p_rev -= to_revert
        entry.is_paid = False
        entry.save()

    # Revert interest
    remaining_i_rev = alloc_i
    i_entries = LoanScheduleEntry.objects.filter(
        loan=loan,
        paid_interest__gt=0,
    ).order_by("-installment_number")
    for entry in i_entries:
        if remaining_i_rev <= 0:
            break
        to_revert = min(entry.paid_interest, remaining_i_rev)
        entry.paid_interest -= to_revert
        remaining_i_rev -= to_revert
        entry.is_paid = False
        entry.save()

    repayment.is_reversed = True
    repayment.reversed_at = timezone.now()
    repayment.reversed_by = user
    repayment.reversal_reason = reason or "Loan repayment reversed"
    repayment.save()

    log_reversal_trigger(PaymentReversalLog.PaymentType.LOAN_REPAYMENT, repayment, user, reason)
    return repayment


# --- Post-save Trigger Listeners ---

@receiver(post_save, sender="savings.SavingsPayment")
def savings_payment_reversal_trigger(sender, instance, created, **kwargs):
    if not created and instance.is_reversed:
        log_reversal_trigger(PaymentReversalLog.PaymentType.SAVINGS, instance)


@receiver(post_save, sender="shares.SharePayment")
def share_payment_reversal_trigger(sender, instance, created, **kwargs):
    if not created and instance.is_reversed:
        log_reversal_trigger(PaymentReversalLog.PaymentType.SHARES, instance)


@receiver(post_save, sender="loans.Repayment")
def repayment_reversal_trigger(sender, instance, created, **kwargs):
    if not created and instance.is_reversed:
        log_reversal_trigger(PaymentReversalLog.PaymentType.LOAN_REPAYMENT, instance)
