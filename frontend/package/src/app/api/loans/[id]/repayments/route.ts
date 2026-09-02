import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_BASE_URL =
  process.env.DJANGO_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/repayments/?loan_id=${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();
    const list = Array.isArray(data) ? data : (data?.results || []);
    return NextResponse.json(list, { status: response.status });
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
    const session = await getServerSession(authOptions);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    const payload = {
      loan: Number(id),
      amount_paid: body.amount || body.amount_paid,
      payment_date: body.payment_date,
      payment_method: body.payment_method || "mpesa",
      transaction_reference: body.transaction_reference || `TXN-${Date.now()}`,
      notes: body.notes,
    };

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/repayments/`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error creating loan repayment:", error);
    return NextResponse.json(
      { error: "Failed to record repayment", detail: error?.message },
      { status: 500 }
    );
  }
}
