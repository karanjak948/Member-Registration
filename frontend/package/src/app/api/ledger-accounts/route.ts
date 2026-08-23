import { NextResponse } from "next/server";

const ROYAL_API_URL =
  process.env.LOAN_API_URL ||
  process.env.NEXT_PUBLIC_LOAN_API_URL ||
  "https://v1.royalltd.co.ke/lne/api";

export async function GET() {
  try {
    const response = await fetch(`${ROYAL_API_URL}/ledger-accounts`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Error in GET /api/ledger-accounts:", error);
    return NextResponse.json([], { status: 500 });
  }
}
