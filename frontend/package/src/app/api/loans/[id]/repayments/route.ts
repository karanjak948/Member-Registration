import { NextRequest, NextResponse } from "next/server";

const ROYAL_API_URL =
  process.env.LOAN_API_URL ||
  process.env.NEXT_PUBLIC_LOAN_API_URL ||
  "https://v1.royalltd.co.ke/lne/api";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const response = await fetch(`${ROYAL_API_URL}/loans/${id}/repayments`, {
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
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching loan repayments:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const response = await fetch(`${ROYAL_API_URL}/loans/${id}/repayments`, {
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
    console.error("Error creating loan repayment:", error);
    return NextResponse.json(
      { error: "Failed to record repayment" },
      { status: 500 }
    );
  }
}
