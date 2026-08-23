import { NextRequest, NextResponse } from "next/server";

const ROYAL_API_URL =
  process.env.LOAN_API_URL ||
  process.env.NEXT_PUBLIC_LOAN_API_URL ||
  "https://v1.royalltd.co.ke/lne/api";

/**
 * Helper to ensure a member exists in the Jiinue Loan Engine database.
 * Matches strictly by name (not dummy shared phones) and registers distinct individuals automatically.
 */
async function ensureEngineMember(
  memberId: number,
  name?: string,
  phone?: string,
): Promise<number> {
  try {
    const cleanName = (name || `SACCO Member #${memberId}`).trim();
    const cleanPhone = (phone || "0700000000").trim();

    // 1. Fetch current members in Royal Loan Engine
    const res = await fetch(`${ROYAL_API_URL}/members`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const members = await res.json();
      if (Array.isArray(members)) {
        // Match by exact/case-insensitive Name (ensures separate people never collide)
        const byName = members.find(
          (m: any) =>
            m.name &&
            m.name.trim().toLowerCase() === cleanName.toLowerCase(),
        );
        if (byName) {
          console.log(`Matched existing Loan Engine member "${byName.name}" (ID ${byName.id})`);
          return byName.id;
        }
      }
    }

    // 2. If not found in Loan Engine: Register/Sync Member on Loan Engine
    console.log(`Registering distinct SACCO Member #${memberId} ("${cleanName}") on Royal Loan Engine...`);
    const createRes = await fetch(`${ROYAL_API_URL}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: cleanName,
        phone: cleanPhone,
      }),
    });

    if (createRes.ok) {
      const newMember = await createRes.json();
      if (newMember?.id) {
        console.log(`Successfully synced Member "${cleanName}" to Loan Engine as ID ${newMember.id}`);
        return newMember.id;
      }
    }
  } catch (err) {
    console.error("Error in ensureEngineMember:", err);
  }

  return memberId;
}

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/loans - Fetching loans from Royal API");

    const response = await fetch(`${ROYAL_API_URL}/loans`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      console.error("Royal API returned non-JSON response:", text.substring(0, 200));
      return NextResponse.json([], { status: 200 });
    }

    const data = await response.json();

    if (!response.ok) {
      console.error(`Royal API returned ${response.status}:`, data);
      return NextResponse.json([], { status: 200 });
    }

    const loanList = Array.isArray(data) ? data : (data?.results || []);
    console.log(`Successfully fetched ${loanList.length} loans`);

    return NextResponse.json(loanList, {
      status: response.status,
    });
  } catch (error) {
    console.error("Error in GET /api/loans:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("POST /api/loans - Incoming Payload:", JSON.stringify(body, null, 2));

    // Basic Validation Check
    if (!body.member_id || !body.loan_product_id || !body.principal_amount) {
      return NextResponse.json(
        {
          error: "Validation Error",
          detail: "member_id, loan_product_id, and principal_amount are required.",
        },
        { status: 400 },
      );
    }

    const {
      member_name,
      member_phone,
      guarantor_name,
      guarantor_phone,
      ...loanPayload
    } = body;

    // 1. Ensure borrower member exists on the Loan Engine
    if (loanPayload.member_id) {
      loanPayload.member_id = await ensureEngineMember(
        Number(loanPayload.member_id),
        member_name,
        member_phone,
      );
    }

    // 2. Ensure guarantor member exists on the Loan Engine (if specified)
    if (loanPayload.guarantor_member_id) {
      loanPayload.guarantor_member_id = await ensureEngineMember(
        Number(loanPayload.guarantor_member_id),
        guarantor_name,
        guarantor_phone,
      );
    }

    // Safeguard: Ensure security_provided_value is not negative
    if (
      loanPayload.security_provided_value !== undefined &&
      loanPayload.security_provided_value !== null
    ) {
      const val = Number(loanPayload.security_provided_value);
      if (val < 0) {
        delete loanPayload.security_provided_value;
      }
    }

    console.log("POST /api/loans - Forwarding to Loan Engine:", JSON.stringify(loanPayload, null, 2));

    const response = await fetch(`${ROYAL_API_URL}/loans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(loanPayload),
    });

    const rawResponseText = await response.text();

    let jsonData;
    try {
      jsonData = JSON.parse(rawResponseText);
    } catch (e) {
      jsonData = { detail: rawResponseText };
    }

    if (!response.ok) {
      console.error(`ROYAL API ERROR [${response.status}]:`, rawResponseText);
      return NextResponse.json(
        {
          error: "Royal API Error",
          detail: jsonData.detail || rawResponseText || response.statusText,
        },
        { status: response.status },
      );
    }

    console.log("Loan registered successfully on Loan Engine:", jsonData);
    return NextResponse.json(jsonData, { status: response.status });
  } catch (error) {
    console.error("Error in POST /api/loans:", error);
    return NextResponse.json(
      {
        error: "Unable to connect to Loan API",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}