import { NextRequest, NextResponse } from "next/server";

const ROYAL_API_URL = "https://v1.royalltd.co.ke/lne/api";

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

    console.log("POST /api/loans - Payload:", JSON.stringify(body, null, 2));

    const response = await fetch(`${ROYAL_API_URL}/loans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    // ================== FORCEFUL DEBUGGING BLOCK ==================
    // We ALWAYS read the raw text first. If it's JSON, we parse it later.
    const rawResponseText = await response.text();

    console.error("==============================================");
    console.error(`ROYAL API RESPONSE STATUS: ${response.status}`);
    console.error("RAW RESPONSE FROM ROYAL API (Full):");
    console.error(rawResponseText);
    console.error("==============================================");

    // Try to parse the JSON. If it fails, we just return the raw text.
    let jsonData;
    try {
      jsonData = JSON.parse(rawResponseText);
    } catch (e) {
      // If it's not JSON, just send the raw string as detail
      jsonData = { detail: rawResponseText };
    }

    // If the HTTP Status is not 200 OK, return the error immediately
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: "Royal API Error", 
          detail: jsonData.detail || rawResponseText || response.statusText
        },
        { status: response.status }
      );
    }

    console.log("Loan created successfully:", jsonData);
    return NextResponse.json(jsonData, { status: response.status });

  } catch (error) {
    console.error("Error in POST /api/loans:", error);
    return NextResponse.json(
      { 
        error: "Unable to connect to Loan API", 
        detail: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}