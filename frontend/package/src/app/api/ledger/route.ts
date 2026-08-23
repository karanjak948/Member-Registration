import { NextRequest, NextResponse } from "next/server";

const ROYAL_API_URL =
  process.env.LOAN_API_URL ||
  process.env.NEXT_PUBLIC_LOAN_API_URL ||
  "https://v1.royalltd.co.ke/lne/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountName = searchParams.get("account_name");
    const loanId = searchParams.get("loan_id");

    const query = new URLSearchParams();
    if (accountName) query.set("account_name", accountName);
    if (loanId) query.set("loan_id", loanId);

    const url = `${ROYAL_API_URL}/ledger${query.toString() ? `?${query.toString()}` : ""}`;
    const response = await fetch(url, {
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
    console.error("Error in GET /api/ledger:", error);
    return NextResponse.json([], { status: 500 });
  }
}
