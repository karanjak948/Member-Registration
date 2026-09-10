"""
M-Pesa C2B Paybill processing service.
Receives Safaricom Daraja confirmation callbacks, matches payments to members and loans,
executes waterfall allocation, updates schedules and ledgers, and dispatches SMS notifications.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime
from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from apps.loans.models import (
    MpesaTransaction,
    MpesaTransactionStatus,
    Loan,
    LoanStatus,
    Repayment,
)
from apps.loans.serializers.repayment_serializers import RepaymentSerializer
from apps.members.models import Member

logger = logging.getLogger(__name__)


class MpesaC2BService:
    """Handles parsing and processing of Safaricom Daraja C2B Paybill confirmations."""

    @staticmethod
    def parse_trans_time(raw_time: str | None) -> datetime:
        """
        Parses Daraja TransTime format 'YYYYMMDDHHmmss' (e.g. '20260910124208')
        into a timezone-aware datetime.
        """
        if not raw_time:
            return timezone.now()

        cleaned = str(raw_time).strip()
        try:
            naive_dt = datetime.strptime(cleaned, "%Y%m%d%H%M%S")
            return timezone.make_aware(naive_dt, timezone.get_current_timezone())
        except (ValueError, TypeError):
            try:
                # Fallback for ISO format
                return datetime.fromisoformat(cleaned)
            except Exception:
                return timezone.now()

    @staticmethod
    def clean_phone(phone: str | None) -> str:
        """Strips formatting from phone numbers for robust matching."""
        if not phone:
            return ""
        digits = re.sub(r"\D", "", str(phone))
        # If starts with 254 and length 12
        if digits.startswith("254") and len(digits) == 12:
            return digits
        # If starts with 0 and length 10 -> convert to 254
        if digits.startswith("0") and len(digits) == 10:
            return "254" + digits[1:]
        return digits

    @classmethod
    def match_account(
        cls, bill_ref_number: str | None, msisdn: str | None
    ) -> tuple[Loan | None, Member | None]:
        """
        Intelligently resolves an incoming payment to an active Loan and/or Member.
        Checks:
          1. Direct Loan Number (e.g. 'LN-000004' or '4')
          2. Member National ID (e.g. '26954308')
          3. Member Membership Number (e.g. 'RC-00001')
          4. Member Phone Number from MSISDN
        """
        ref = (bill_ref_number or "").strip()
        matched_loan = None
        matched_member = None

        active_statuses = [
            LoanStatus.ACTIVE,
            LoanStatus.WATCHFUL,
            LoanStatus.NON_PERFORMING,
            LoanStatus.DOUBTFUL,
        ]

        if ref:
            # 1. Check exact or prefixed Loan Number (e.g. LN-000004 or numeric 4)
            loan_obj = Loan.objects.filter(loan_number__iexact=ref).first()
            if not loan_obj and ref.isdigit():
                # Try LN-{number} padded
                padded = f"LN-{int(ref):06d}"
                loan_obj = Loan.objects.filter(loan_number__iexact=padded).first()

            if loan_obj:
                matched_loan = loan_obj
                matched_member = loan_obj.member
                return matched_loan, matched_member

            # 2. Check Member National ID (e.g. '26954308')
            member_by_nat_id = Member.objects.filter(national_id__iexact=ref).first()
            if member_by_nat_id:
                matched_member = member_by_nat_id
                # Check for active loan belonging to this member
                active_loan = (
                    Loan.objects.filter(
                        member=member_by_nat_id,
                        status__in=active_statuses,
                    )
                    .order_by("-outstanding_balance")
                    .first()
                )
                if active_loan:
                    matched_loan = active_loan
                return matched_loan, matched_member

            # 3. Check Member Membership Number (e.g. 'RC-00001' or '00001')
            member_by_mem_no = Member.objects.filter(membership_number__iexact=ref).first()
            if not member_by_mem_no and ref.isdigit():
                padded_rc = f"RC-{int(ref):05d}"
                member_by_mem_no = Member.objects.filter(membership_number__iexact=padded_rc).first()

            if member_by_mem_no:
                matched_member = member_by_mem_no
                active_loan = (
                    Loan.objects.filter(
                        member=member_by_mem_no,
                        status__in=active_statuses,
                    )
                    .order_by("-outstanding_balance")
                    .first()
                )
                if active_loan:
                    matched_loan = active_loan
                return matched_loan, matched_member

        # 4. Fallback: Check MSISDN / Phone Number
        clean_msisdn = cls.clean_phone(msisdn)
        if clean_msisdn and not matched_member:
            # Query members whose phone number matches or ends with the 9-digit suffix
            suffix = clean_msisdn[-9:]
            member_by_phone = (
                Member.objects.filter(phone_number__endswith=suffix)
                .order_by("-created_at")
                .first()
            )
            if member_by_phone:
                matched_member = member_by_phone
                active_loan = (
                    Loan.objects.filter(
                        member=member_by_phone,
                        status__in=active_statuses,
                    )
                    .order_by("-outstanding_balance")
                    .first()
                )
                if active_loan:
                    matched_loan = active_loan

        return matched_loan, matched_member

    @classmethod
    def verify_with_relay(
        cls,
        verify_url: str,
        unique_serial: str | int,
        api_key: str | None = None,
    ) -> tuple[bool, dict | str]:
        """
        POSTs back to verify_url with header X-API-Key and body {"unique_serial": unique_serial}.
        Returns (True, response_data) if successful and confirmed, (False, error_reason) otherwise.
        """
        import requests
        from django.conf import settings

        if not verify_url:
            verify_url = getattr(
                settings,
                "ROYAL_PAYMENTS_DEFAULT_VERIFY_URL",
                "https://system.royalltd.co.ke/payments/verifypayment",
            )

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "RoyalSACCO-Core/1.0",
        }
        if api_key:
            headers["X-API-Key"] = api_key

        timeout = getattr(settings, "ROYAL_PAYMENTS_VERIFY_TIMEOUT", 10)
        body = {"unique_serial": unique_serial}

        logger.info(f"Dispatching verification handshake to {verify_url} for serial={unique_serial}")

        try:
            resp = requests.post(verify_url, json=body, headers=headers, timeout=timeout)
            if not (200 <= resp.status_code < 300):
                err = f"Verification failed with HTTP status {resp.status_code}: {resp.text[:300]}"
                logger.warning(err)
                return False, err

            try:
                data = resp.json()
            except Exception:
                data = {"raw_response": resp.text, "status": "success"}

            return True, data

        except Exception as exc:
            err = f"Connection error reaching verify_url {verify_url}: {exc}"
            logger.exception(err)
            return False, err

    @classmethod
    def validate_payload_match(cls, payment_payload: dict, verification_data: dict | str) -> tuple[bool, str]:
        """
        Validates that verified returned data matches the paymentPayload.
        """
        if isinstance(verification_data, str):
            return True, "Verified (text confirmation)"

        if not isinstance(verification_data, dict):
            return True, "Verified"

        # If verify response has payment details embedded, cross-check TransID and TransAmount
        nested = (
            verification_data.get("paymentPayload")
            or verification_data.get("data")
            or verification_data.get("payment")
            or verification_data
        )

        expected_trans_id = str(payment_payload.get("TransID", "")).strip().upper()
        verified_trans_id = str(nested.get("TransID", nested.get("trans_id", ""))).strip().upper()

        if verified_trans_id and expected_trans_id and verified_trans_id != expected_trans_id:
            msg = f"TransID mismatch: expected '{expected_trans_id}' but relay verified '{verified_trans_id}'"
            logger.error(msg)
            return False, msg

        expected_amount = str(payment_payload.get("TransAmount", "")).strip()
        verified_amount = str(nested.get("TransAmount", nested.get("amount", ""))).strip()

        if verified_amount and expected_amount:
            try:
                if Decimal(expected_amount) != Decimal(verified_amount):
                    msg = f"TransAmount mismatch: expected '{expected_amount}' but relay verified '{verified_amount}'"
                    logger.error(msg)
                    return False, msg
            except Exception:
                pass

        return True, "Matched & Verified"

    @classmethod
    @transaction.atomic
    def process_confirmation(
        cls,
        payload: dict,
        unique_serial: str | int | None = None,
        verify_url: str | None = None,
        is_verified: bool = False,
        verification_data: dict | str | None = None,
    ) -> tuple[MpesaTransaction, dict]:
        """
        Processes an incoming Safaricom Daraja C2B confirmation notification.
        Guarantees idempotency on TransID.
        """
        trans_id = str(payload.get("TransID", "")).strip().upper()
        if not trans_id:
            logger.error("M-Pesa confirmation received without TransID.")
            raise ValueError("Missing TransID in M-Pesa payload.")

        # 1. Idempotency Check
        existing_tx = MpesaTransaction.objects.filter(trans_id=trans_id).first()
        if existing_tx:
            logger.info(f"M-Pesa TransID {trans_id} already exists. Returning existing record.")
            return existing_tx, {"ResultCode": 0, "ResultDesc": "Accepted"}

        # 2. Extract payload fields
        trans_type = str(payload.get("TransactionType", "Pay Bill")).strip()
        trans_time = cls.parse_trans_time(payload.get("TransTime"))
        trans_amount = Decimal(str(payload.get("TransAmount", "0.00")))
        short_code = str(payload.get("BusinessShortCode", "")).strip()
        bill_ref = str(payload.get("BillRefNumber", "")).strip()
        invoice_no = str(payload.get("InvoiceNumber", "")).strip()
        raw_balance = payload.get("OrgAccountBalance")
        org_balance = Decimal(str(raw_balance)) if raw_balance and str(raw_balance).strip() else None
        third_party_id = str(payload.get("ThirdPartyTransID", "")).strip()
        msisdn = str(payload.get("MSISDN", "")).strip()
        first_name = str(payload.get("FirstName", "")).strip()

        # 3. Create initial MpesaTransaction record
        mpesa_tx = MpesaTransaction.objects.create(
            trans_id=trans_id,
            transaction_type=trans_type,
            trans_time=trans_time,
            trans_amount=trans_amount,
            business_short_code=short_code,
            bill_ref_number=bill_ref,
            invoice_number=invoice_no,
            org_account_balance=org_balance,
            third_party_trans_id=third_party_id,
            msisdn=msisdn,
            first_name=first_name,
            raw_payload=payload,
            unique_serial=str(unique_serial) if unique_serial is not None else None,
            verify_url=verify_url,
            is_verified=is_verified if unique_serial is not None else True,
            verification_response=verification_data if isinstance(verification_data, dict) else ({"info": str(verification_data)} if verification_data else None),
            status=MpesaTransactionStatus.UNALLOCATED if (is_verified or unique_serial is None) else MpesaTransactionStatus.VERIFICATION_FAILED,
        )

        # Guard: If verification failed, do NOT credit or allocate to any loan
        if unique_serial is not None and not is_verified:
            logger.warning(f"M-Pesa payment {trans_id} skipped loan allocation because verification failed.")
            return mpesa_tx, {"ResultCode": 1, "ResultDesc": "Verification Failed"}

        # 4. Resolve Target Account (Loan / Member)
        try:
            loan, member = cls.match_account(bill_ref, msisdn)

            if member:
                mpesa_tx.member = member

            if loan:
                mpesa_tx.loan = loan

                # Check if a repayment with this trans_id already exists
                repayment = Repayment.objects.filter(transaction_reference=trans_id).first()

                if not repayment:
                    # Construct notes
                    payer_info = f"{first_name} ({msisdn})".strip()
                    notes = f"M-Pesa C2B Paybill payment from {payer_info}. Ref: {bill_ref}"

                    serializer = RepaymentSerializer(
                        data={
                            "loan": loan.id,
                            "amount_paid": trans_amount,
                            "payment_date": trans_time.date(),
                            "payment_method": "mpesa",
                            "transaction_reference": trans_id,
                            "notes": notes,
                        }
                    )
                    serializer.is_valid(raise_exception=True)
                    repayment = serializer.save()

                mpesa_tx.repayment = repayment
                mpesa_tx.status = MpesaTransactionStatus.COMPLETED
                mpesa_tx.save(update_fields=["member", "loan", "repayment", "status"])
                logger.info(
                    f"Successfully applied M-Pesa payment {trans_id} (KES {trans_amount}) to Loan {loan.loan_number} ({member})."
                )
            else:
                # No active loan found - keep as UNALLOCATED for administrative review
                mpesa_tx.status = MpesaTransactionStatus.UNALLOCATED
                mpesa_tx.save(update_fields=["member", "status"])
                logger.warning(
                    f"M-Pesa payment {trans_id} recorded as UNALLOCATED. Ref: '{bill_ref}', Member: {member}."
                )

        except Exception as err:
            logger.exception(f"Error processing M-Pesa transaction {trans_id}: {err}")
            mpesa_tx.error_message = str(err)
            mpesa_tx.status = MpesaTransactionStatus.FAILED
            mpesa_tx.save(update_fields=["error_message", "status"])

        return mpesa_tx, {"ResultCode": 0, "ResultDesc": "Accepted"}
