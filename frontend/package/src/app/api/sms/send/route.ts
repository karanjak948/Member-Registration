import { NextResponse } from "next/server";

const BULK_SMS_BASE_URL = "https://bulksms.pefranksmartsolutions.co.ke/api/v1";
const BULK_SMS_API_KEY = "f5e10366fd4cbc04aa487320ece1f40bb246b363464966057c60f6934kdf38ab";
const BULK_SMS_CONSUMER_KEY = "6f4ebef63cb63733b26e23e4461bf12e383060271d1386255964b4ceecedaba6";
const BULK_SMS_CONSUMER_SECRET = "b5f0ea8138d11ade514f370583bcc429";
const BULK_SMS_SENDER_ID = "KIY TOYS";

function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0") && clean.length === 10) {
    return "254" + clean.slice(1);
  } else if ((clean.startsWith("7") || clean.startsWith("1")) && clean.length === 9) {
    return "254" + clean;
  } else if (clean.startsWith("254") && clean.length === 12) {
    return clean;
  }
  return clean;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone_number, message, contacts } = body;

    const targetContacts: string[] = [];
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      contacts.forEach((p: string) => {
        const formatted = formatPhoneNumber(p);
        if (formatted) targetContacts.push(formatted);
      });
    } else if (phone_number) {
      const formatted = formatPhoneNumber(phone_number);
      if (formatted) targetContacts.push(formatted);
    }

    if (targetContacts.length === 0) {
      return NextResponse.json({ error: "No valid recipient phone numbers provided." }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    // 1. Get Access Token
    const tokenRes = await fetch(`${BULK_SMS_BASE_URL}/access-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: BULK_SMS_API_KEY,
        consumer_key: BULK_SMS_CONSUMER_KEY,
        consumer_secrete: BULK_SMS_CONSUMER_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text();
      console.error("SMS Token Error:", tokenErr);
      return NextResponse.json({ error: "Failed to authenticate with Bulk SMS Gateway." }, { status: 500 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: "Access token missing from SMS Gateway response." }, { status: 500 });
    }

    // 2. Send SMS
    const sendRes = await fetch(`${BULK_SMS_BASE_URL}/send-sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: BULK_SMS_SENDER_ID,
        access_token: accessToken,
        sms: message.trim(),
        contacts: targetContacts,
      }),
    });

    const sendData = await sendRes.json().catch(() => ({}));

    if (sendRes.ok) {
      return NextResponse.json({
        success: true,
        message: sendData.success || "SMS sent successfully!",
        response: sendData,
      });
    } else {
      return NextResponse.json(
        { error: sendData.detail || sendData.error || "Failed to dispatch SMS via gateway." },
        { status: sendRes.status }
      );
    }
  } catch (err: any) {
    console.error("SMS API Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
  }
}
