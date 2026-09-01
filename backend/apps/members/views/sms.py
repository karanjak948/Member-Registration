from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.common.sms_service import BulkSMSService


class SendSMSAPIView(APIView):
    """
    API endpoint to send individual or broadcast SMS messages via BulkSMS Gateway.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        contacts = request.data.get("contacts")
        phone_number = request.data.get("phone_number")
        message = request.data.get("message")

        if not message or not str(message).strip():
            return Response(
                {"error": "SMS message content cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_contacts = []
        if contacts and isinstance(contacts, list):
            target_contacts = contacts
        elif phone_number:
            target_contacts = [phone_number]

        if not target_contacts:
            return Response(
                {"error": "No valid recipient phone numbers provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = []
        success_count = 0

        for phone in target_contacts:
            res = BulkSMSService.send_sms(phone_number=str(phone), message=str(message).strip())
            results.append(res)
            if res.get("success"):
                success_count += 1

        if success_count > 0 or len(target_contacts) == 1:
            return Response(
                {
                    "success": True,
                    "message": f"SMS dispatched to {success_count} of {len(target_contacts)} recipients.",
                    "results": results,
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "error": results[0].get("error", "Failed to dispatch SMS via gateway."),
                    "results": results,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
