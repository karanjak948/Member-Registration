import json
import logging
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional

import os

logger = logging.getLogger(__name__)

BULK_SMS_BASE_URL = os.getenv("BULK_SMS_BASE_URL", "https://bulksms.pefranksmartsolutions.co.ke/api/v1")

# Credentials provided for Bulk SMS Gateway
BULK_SMS_API_KEY = os.getenv("BULK_SMS_API_KEY", "f5e10366fd4cbc04aa487320ece1f40bb246b363464966057c60f6934kdf38ab")
BULK_SMS_CONSUMER_KEY = os.getenv("BULK_SMS_CONSUMER_KEY", "6f4ebef63cb63733b26e23e4461bf12e383060271d1386255964b4ceecedaba6")
BULK_SMS_CONSUMER_SECRET = os.getenv("BULK_SMS_CONSUMER_SECRET", "b5f0ea8138d11ade514f370583bcc429")
BULK_SMS_SENDER_ID = os.getenv("BULK_SMS_SENDER_ID", "KIY TOYS")
BULK_SMS_ACCESS_TOKEN = os.getenv("BULK_SMS_ACCESS_TOKEN", "58a0a73af923488f8f52ccf32378ab8e3313d7753e4f13194fc9c3364279fc17")


class BulkSMSService:
    """
    Service client for sending SMS notifications via the Bulk SMS Gateway API.
    """

    @classmethod
    def format_phone_number(cls, phone: str) -> str:
        """
        Format Kenyan phone numbers to international standard (2547XXXXXXXX or 2541XXXXXXXX).
        """
        if not phone:
            return ""
        clean_phone = "".join(filter(str.isdigit, str(phone)))
        if clean_phone.startswith("0") and len(clean_phone) == 10:
            return "254" + clean_phone[1:]
        elif clean_phone.startswith("7") or clean_phone.startswith("1") and len(clean_phone) == 9:
            return "254" + clean_phone
        elif clean_phone.startswith("254") and len(clean_phone) == 12:
            return clean_phone
        return clean_phone

    @classmethod
    def get_access_token(cls) -> Optional[str]:
        """
        Request JWT access token from Bulk SMS gateway.
        """
        url = f"{BULK_SMS_BASE_URL}/access-token"
        payload = {
            "api_key": BULK_SMS_API_KEY,
            "consumer_key": BULK_SMS_CONSUMER_KEY,
            "consumer_secrete": BULK_SMS_CONSUMER_SECRET,
        }

        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=data,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                body = response.read().decode("utf-8")
                res_json = json.loads(body)
                token = res_json.get("access_token")
                if token:
                    return token
                logger.error(f"BulkSMS token error response: {body}")
        except Exception as e:
            logger.error(f"Failed to fetch BulkSMS access token: {e}")
        
        # Fallback to configured active access token
        if BULK_SMS_ACCESS_TOKEN:
            logger.info("Using configured active BulkSMS access token.")
            return BULK_SMS_ACCESS_TOKEN
        return None

    @classmethod
    def send_sms(cls, phone_number: str, message: str, sender_id: str = BULK_SMS_SENDER_ID) -> Dict[str, Any]:
        """
        Send an SMS notification to a specified phone number.
        """
        formatted_phone = cls.format_phone_number(phone_number)
        if not formatted_phone:
            return {"success": False, "error": "Invalid phone number provided"}

        token = cls.get_access_token()
        if not token:
            return {"success": False, "error": "Failed to obtain SMS access token"}

        url = f"{BULK_SMS_BASE_URL}/send-sms"
        payload = {
            "sender": sender_id,
            "access_token": token,
            "sms": message,
            "contacts": [formatted_phone]
        }

        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=data,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                body = response.read().decode("utf-8")
                res_json = json.loads(body)
                logger.info(f"BulkSMS response for {formatted_phone}: {res_json}")
                return {"success": True, "response": res_json}
        except Exception as e:
            logger.error(f"Failed to send BulkSMS to {formatted_phone}: {e}")
            return {"success": False, "error": str(e)}

    @classmethod
    def send_welcome_sms(cls, member_name: str, membership_number: str, phone_number: str):
        """
        Helper method to send welcome SMS upon member registration.
        """
        message = (
            f"Welcome to Royal SACCO, {member_name}! "
            f"Your member registration is complete. Your Membership No. is {membership_number}. "
            f"Thank you for joining us."
        )
        return cls.send_sms(phone_number, message)
