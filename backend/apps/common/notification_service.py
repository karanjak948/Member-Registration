import logging
from decimal import Decimal
from typing import Optional, Dict, Any

from apps.common.sms_service import BulkSMSService
from apps.common.sms_constants import SMSEventType, SMSDeliveryStatus

logger = logging.getLogger(__name__)


def _format_curr(val: Any) -> str:
    try:
        d = Decimal(str(val))
        return f"{d:,.2f}"
    except Exception:
        return str(val)


class NotificationService:
    """
    Centralized event-driven notification service for Royal SACCO.
    Dispatches automated transactional SMS and records audit history in SMSLog.
    """

    @classmethod
    def _dispatch_and_log(
        cls,
        phone_number: str,
        message: str,
        event_type: str,
        member=None,
        recipient_name: str = "",
    ) -> Dict[str, Any]:
        """
        Internal dispatcher that sends SMS via gateway and persists SMSLog audit.
        Guarantees that gateway exceptions do not interrupt calling database transactions.
        """
        formatted_phone = BulkSMSService.format_phone_number(phone_number)
        if not formatted_phone:
            logger.warning(f"Invalid phone number provided for {event_type}: {phone_number}")
            return {"success": False, "error": "Invalid recipient phone number"}

        status = SMSDeliveryStatus.FAILED
        error_message = None
        gateway_response = {}

        try:
            res = BulkSMSService.send_sms(phone_number=formatted_phone, message=message)
            gateway_response = res.get("response", {})
            if res.get("success"):
                status = SMSDeliveryStatus.SENT
            else:
                error_message = str(res.get("error", "Gateway delivery failure"))
        except Exception as e:
            logger.error(f"Failed to dispatch {event_type} SMS to {formatted_phone}: {e}")
            error_message = str(e)

        try:
            from apps.members.models.sms_log import SMSLog
            SMSLog.objects.create(
                member=member,
                recipient_name=recipient_name or (f"{member.first_name} {member.other_names}".strip() if member else ""),
                phone_number=formatted_phone,
                message=message,
                event_type=event_type,
                status=status,
                error_message=error_message,
                gateway_response=gateway_response,
            )
        except Exception as log_err:
            logger.error(f"Failed to record SMSLog for {formatted_phone}: {log_err}")

        return {
            "success": status == SMSDeliveryStatus.SENT,
            "error": error_message,
            "phone": formatted_phone,
        }

    # -------------------------------------------------------------------------
    # 1. Loan Application Confirmation
    # -------------------------------------------------------------------------
    @classmethod
    def notify_loan_application(cls, loan) -> Dict[str, Any]:
        """
        Triggered upon loan application submission.
        """
        member = loan.member
        first_name = member.first_name.title()
        amt_str = _format_curr(loan.principal_amount)
        product_name = loan.loan_product.product_name

        message = (
            f"Dear {first_name}, your loan application {loan.loan_number} for KES {amt_str} "
            f"({product_name}) has been received and is under review. "
            f"Thank you for choosing Royal SACCO."
        )

        return cls._dispatch_and_log(
            phone_number=member.phone_number,
            message=message,
            event_type=SMSEventType.LOAN_APPLICATION,
            member=member,
            recipient_name=f"{member.first_name} {member.other_names}".strip(),
        )

    # -------------------------------------------------------------------------
    # 2. Loan Approval Confirmation
    # -------------------------------------------------------------------------
    @classmethod
    def notify_loan_approval(cls, loan) -> Dict[str, Any]:
        """
        Triggered when a loan application is approved by credit officers.
        """
        member = loan.member
        first_name = member.first_name.title()
        amt_str = _format_curr(loan.principal_amount)

        message = (
            f"Dear {first_name}, congratulations! Your loan application {loan.loan_number} "
            f"of KES {amt_str} has been APPROVED. Disbursement is being scheduled. "
            f"Royal SACCO."
        )

        return cls._dispatch_and_log(
            phone_number=member.phone_number,
            message=message,
            event_type=SMSEventType.LOAN_APPROVAL,
            member=member,
            recipient_name=f"{member.first_name} {member.other_names}".strip(),
        )

    # -------------------------------------------------------------------------
    # 3. Loan Disbursement Confirmation (Amount + Installment Breakdown)
    # -------------------------------------------------------------------------
    @classmethod
    def notify_loan_disbursement(
        cls, loan, installment_amount: Any = None, first_due_date: Any = None
    ) -> Dict[str, Any]:
        """
        Triggered upon loan disbursement.
        Sends disbursement amount, regular installment amount, and first due date.
        """
        member = loan.member
        first_name = member.first_name.title()
        disb_str = _format_curr(loan.principal_amount)

        # Retrieve installment amount from schedule if not explicitly provided
        if installment_amount is None:
            first_entry = loan.schedule_entries.order_by("period_number").first()
            installment_amount = first_entry.expected_amount if first_entry else (loan.principal_amount / loan.num_periods)

        if first_due_date is None:
            first_entry = loan.schedule_entries.order_by("period_number").first()
            first_due_date = first_entry.due_date if first_entry else "next month"

        inst_str = _format_curr(installment_amount)
        due_str = str(first_due_date)

        message = (
            f"Dear {first_name}, KES {disb_str} for loan {loan.loan_number} has been DISBURSED. "
            f"Monthly installment: KES {inst_str}, first due on {due_str}. "
            f"Royal SACCO."
        )

        return cls._dispatch_and_log(
            phone_number=member.phone_number,
            message=message,
            event_type=SMSEventType.LOAN_DISBURSEMENT,
            member=member,
            recipient_name=f"{member.first_name} {member.other_names}".strip(),
        )

    # -------------------------------------------------------------------------
    # 4. Repayment Confirmation
    # -------------------------------------------------------------------------
    @classmethod
    def notify_repayment(cls, repayment, remaining_balance: Any = None) -> Dict[str, Any]:
        """
        Triggered upon recording a loan repayment.
        """
        loan = repayment.loan
        member = loan.member
        first_name = member.first_name.title()
        amt_paid_str = _format_curr(repayment.amount_paid)
        rem_bal_str = _format_curr(remaining_balance if remaining_balance is not None else loan.outstanding_balance)
        txn_ref = repayment.transaction_reference or repayment.repayment_number

        message = (
            f"Dear {first_name}, payment of KES {amt_paid_str} for loan {loan.loan_number} "
            f"received on {repayment.payment_date}. Ref: {txn_ref}. "
            f"Outstanding balance: KES {rem_bal_str}. Royal SACCO."
        )

        return cls._dispatch_and_log(
            phone_number=member.phone_number,
            message=message,
            event_type=SMSEventType.REPAYMENT_CONFIRMATION,
            member=member,
            recipient_name=f"{member.first_name} {member.other_names}".strip(),
        )

    # -------------------------------------------------------------------------
    # 5. Loan Completion Notification
    # -------------------------------------------------------------------------
    @classmethod
    def notify_loan_completion(cls, loan) -> Dict[str, Any]:
        """
        Triggered when a loan balance zeroes out and the loan closes.
        """
        member = loan.member
        first_name = member.first_name.title()

        message = (
            f"Dear {first_name}, congratulations! Your loan {loan.loan_number} is "
            f"FULLY REPAID and closed. Thank you for your continued commitment with Royal SACCO."
        )

        return cls._dispatch_and_log(
            phone_number=member.phone_number,
            message=message,
            event_type=SMSEventType.LOAN_COMPLETION,
            member=member,
            recipient_name=f"{member.first_name} {member.other_names}".strip(),
        )

    # -------------------------------------------------------------------------
    # 6. Overdue Delinquency Notification
    # -------------------------------------------------------------------------
    @classmethod
    def notify_overdue_loan(
        cls, loan, days_overdue: int, overdue_amount: Any = None
    ) -> Dict[str, Any]:
        """
        Triggered during aging or delinquency notification batch runs.
        """
        member = loan.member
        first_name = member.first_name.title()
        overdue_str = _format_curr(overdue_amount if overdue_amount is not None else loan.outstanding_balance)

        message = (
            f"Dear {first_name}, your loan {loan.loan_number} is overdue by {days_overdue} days "
            f"with an outstanding amount of KES {overdue_str}. "
            f"Please remit payment promptly to avoid penalties. Royal SACCO."
        )

        return cls._dispatch_and_log(
            phone_number=member.phone_number,
            message=message,
            event_type=SMSEventType.OVERDUE_ALERT,
            member=member,
            recipient_name=f"{member.first_name} {member.other_names}".strip(),
        )

    # -------------------------------------------------------------------------
    # 7. Member Welcome Registration Notification
    # -------------------------------------------------------------------------
    @classmethod
    def notify_member_registration(cls, member) -> Dict[str, Any]:
        """
        Triggered immediately after new member creation.
        """
        first_name = (member.first_name or "Member").title()
        membership_no = member.membership_number or "PENDING"

        message = (
            f"Welcome to Royal SACCO, {first_name}! "
            f"Your member registration is complete. Your Membership No. is {membership_no}. "
            f"Thank you for joining us."
        )

        return cls._dispatch_and_log(
            phone_number=member.phone_number,
            message=message,
            event_type=SMSEventType.WELCOME,
            member=member,
            recipient_name=f"{member.first_name} {member.other_names}".strip(),
        )
