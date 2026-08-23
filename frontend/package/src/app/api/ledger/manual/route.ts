import { NextRequest, NextResponse } from "next/server";

const ROYAL_API_URL =
  process.env.LOAN_API_URL ||
  process.env.NEXT_PUBLIC_LOAN_API_URL ||
  "https://v1.royalltd.co.ke/lne/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${ROYAL_API_URL}/ledger/manual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error in POST /api/ledger/manual:", error);
    return NextResponse.json(
      { error: "Failed to record manual transaction" },
      { status: 500 }
    );
  }
}
