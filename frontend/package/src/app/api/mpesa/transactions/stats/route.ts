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
    const url = `${API_BASE_URL.replace(/\/$/, "")}/mpesa/transactions/stats/${searchParams ? `?${searchParams}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("GET /api/mpesa/transactions/stats error:", error);
    return NextResponse.json(
      {
        total_count: 0,
        total_amount: 0,
        completed_count: 0,
        completed_amount: 0,
        unallocated_count: 0,
        unallocated_amount: 0,
        failed_count: 0,
      },
      { status: 200 }
    );
  }
}
