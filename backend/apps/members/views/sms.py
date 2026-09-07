import logging
from rest_framework import status, viewsets, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.common.notification_service import NotificationService
from apps.common.sms_service import BulkSMSService
from apps.members.models import Member
from apps.members.models.sms_log import SMSLog, SMSEventType, SMSDeliveryStatus
from apps.members.serializers.sms_serializer import SMSLogSerializer

logger = logging.getLogger(__name__)


class SendSMSAPIView(APIView):
    """
    API endpoint to send individual or bulk broadcast SMS messages.
    Supports recipient personalization via merge tags: {name}, {membership_no}, {phone}.
    Automatically records audit logs in SMSLog.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        contacts = request.data.get("contacts")
        phone_number = request.data.get("phone_number")
        raw_message = request.data.get("message")
        recipient_type = request.data.get("recipient_type", "custom")

        if not raw_message or not str(raw_message).strip():
            return Response(
                {"error": "SMS message content cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        template_message = str(raw_message).strip()
        recipient_items = []

        # 1. Targeting by Member Status
        if recipient_type == "all":
            members = Member.objects.all()
            for m in members:
                if m.phone_number:
                    recipient_items.append({
                        "phone": m.phone_number,
                        "member": m,
                        "name": f"{m.first_name} {m.other_names}".strip(),
                        "membership_no": m.membership_number,
                    })
        elif recipient_type == "active":
            members = Member.objects.filter(status=Member.MemberStatus.ACTIVE)
            for m in members:
                if m.phone_number:
                    recipient_items.append({
                        "phone": m.phone_number,
                        "member": m,
                        "name": f"{m.first_name} {m.other_names}".strip(),
                        "membership_no": m.membership_number,
                    })
        elif recipient_type == "overdue":
            # Target members with overdue loans
            from apps.loans.models import Loan, LoanStatus
            overdue_loans = Loan.objects.filter(
                status__in=[LoanStatus.WATCHFUL, LoanStatus.NON_PERFORMING, LoanStatus.DOUBTFUL]
            ).select_related("member")
            seen_members = set()
            for l in overdue_loans:
                m = l.member
                if m.id not in seen_members and m.phone_number:
                    seen_members.add(m.id)
                    recipient_items.append({
                        "phone": m.phone_number,
                        "member": m,
                        "name": f"{m.first_name} {m.other_names}".strip(),
                        "membership_no": m.membership_number,
                    })
        else:
            # Custom contacts list or single phone number
            target_phones = []
            if contacts and isinstance(contacts, list):
                target_phones = contacts
            elif phone_number:
                target_phones = [phone_number]

            # Match phones to registered members if available
            member_by_phone = {}
            for m in Member.objects.filter(phone_number__in=target_phones):
                member_by_phone[m.phone_number] = m

            for p in target_phones:
                m = member_by_phone.get(p)
                recipient_items.append({
                    "phone": p,
                    "member": m,
                    "name": f"{m.first_name} {m.other_names}".strip() if m else "",
                    "membership_no": m.membership_number if m else "",
                })

        if not recipient_items:
            return Response(
                {"error": "No valid recipient contacts found for dispatch."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Dispatch with merge tag substitution
        results = []
        success_count = 0

        for item in recipient_items:
            # Substitute merge tags
            msg = (
                template_message
                .replace("{name}", item["name"] or "Member")
                .replace("{membership_no}", item["membership_no"] or "")
                .replace("{phone}", item["phone"])
            )

            res = NotificationService._dispatch_and_log(
                phone_number=item["phone"],
                message=msg,
                event_type=SMSEventType.BULK_BROADCAST,
                member=item["member"],
                recipient_name=item["name"],
            )
            results.append(res)
            if res.get("success"):
                success_count += 1

        first_error = None
        if results:
            for r in results:
                if not r.get("success") and r.get("error"):
                    first_error = r.get("error")
                    break

        status_code = status.HTTP_200_OK if success_count > 0 else status.HTTP_400_BAD_REQUEST

        return Response(
            {
                "success": success_count > 0,
                "error": first_error if success_count == 0 else None,
                "message": (
                    f"Broadcast completed: {success_count} of {len(recipient_items)} SMS delivered."
                    if success_count > 0
                    else f"SMS delivery failed: {first_error or 'Gateway rejected delivery.'}"
                ),
                "dispatched_count": success_count,
                "total_recipients": len(recipient_items),
                "results": results,
            },
            status=status_code,
        )


class SMSLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for SMS delivery audit logs.
    """
    queryset = SMSLog.objects.all().select_related("member")
    serializer_class = SMSLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["phone_number", "recipient_name", "message", "member__membership_number"]
    ordering_fields = ["created_at", "status", "event_type"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        event_type = self.request.query_params.get("event_type")
        if status_param:
            qs = qs.filter(status=status_param)
        if event_type:
            qs = qs.filter(event_type=event_type)
        return qs


class SendOverdueSMSAPIView(APIView):
    """
    Convenience endpoint to trigger overdue notifications to all delinquent loans.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from apps.loans.models import Loan, LoanStatus
        from django.utils import timezone

        today = timezone.now().date()
        active_loans = Loan.objects.filter(
            status__in=[
                LoanStatus.ACTIVE,
                LoanStatus.WATCHFUL,
                LoanStatus.NON_PERFORMING,
                LoanStatus.DOUBTFUL,
            ]
        ).select_related("member", "loan_product")

        dispatched = 0
        failed = 0
        results = []

        for loan in active_loans:
            oldest_unpaid = loan.schedule_entries.filter(is_paid=False).order_by("due_date").first()
            if oldest_unpaid and oldest_unpaid.due_date < today:
                days_overdue = (today - oldest_unpaid.due_date).days
                overdue_amount = oldest_unpaid.total_due
                res = NotificationService.notify_overdue_loan(
                    loan=loan,
                    days_overdue=days_overdue,
                    overdue_amount=overdue_amount,
                )
                if res.get("success"):
                    dispatched += 1
                else:
                    failed += 1
                results.append({
                    "loan_number": loan.loan_number,
                    "member": f"{loan.member.first_name} {loan.member.other_names}".strip(),
                    "phone": loan.member.phone_number,
                    "days_overdue": days_overdue,
                    "overdue_amount": str(overdue_amount),
                    "status": "Sent" if res.get("success") else "Failed",
                })

        return Response({
            "success": True,
            "message": f"Dispatched overdue notifications to {dispatched} borrowers ({failed} failed).",
            "dispatched_count": dispatched,
            "failed_count": failed,
            "results": results,
        })
