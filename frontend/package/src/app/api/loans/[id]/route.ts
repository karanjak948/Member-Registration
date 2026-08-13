import { NextRequest, NextResponse } from "next/server";

const ROYAL_API_URL = "https://v1.royalltd.co.ke/lne/api";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // ✅ MUST await params in Next.js 16
    const { id: loanId } = await params;

    console.log(`Fetching loan ${loanId} from Royal API...`);

    const response = await fetch(`${ROYAL_API_URL}/loans/${loanId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      console.error(`Royal API returned non-JSON response for loan ${loanId}:`, text.substring(0, 200));

      return NextResponse.json(
        {
          error: "Loan not found",
          detail: `Loan with ID ${loanId} does not exist`,
        },
        { status: 404 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch loan",
          detail: data?.detail || response.statusText,
        },
        { status: response.status }
      );
    }

    console.log(`Loan ${loanId} fetched successfully`);
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(`Error fetching loan:`, error);

    return NextResponse.json(
      {
        error: "Unable to connect to Loan API",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}