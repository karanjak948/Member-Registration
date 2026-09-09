import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_BASE_URL =
  process.env.DJANGO_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${API_BASE_URL.replace(/\/$/, "")}/loans/${searchParams ? `?${searchParams}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();
    const loanList = Array.isArray(data) ? data : (data?.results || []);
    return NextResponse.json(loanList, { status: response.status });
  } catch (error: any) {
    console.error("GET /api/loans error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const incomingAuth = request.headers.get("Authorization");
    if (incomingAuth) {
      headers["Authorization"] = incomingAuth;
    } else if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    // Preserve all fields (guarantors_data, collaterals_data, etc.) and ensure DRF foreign keys
    const payload = {
      ...body,
      member: body.member_id || body.member,
      loan_product: body.loan_product_id || body.loan_product,
    };

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/loans/`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("POST /api/loans error:", error);
    return NextResponse.json(
      { error: "Failed to apply for loan", detail: error?.message },
      { status: 500 }
    );
  }
}