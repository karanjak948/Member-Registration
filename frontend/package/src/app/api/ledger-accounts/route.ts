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

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/ledger-accounts/`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();
    const list = Array.isArray(data) ? data : (data?.results || []);
    return NextResponse.json(list, { status: response.status });
  } catch (error) {
    console.error("Error in GET /api/ledger-accounts:", error);
    return NextResponse.json([], { status: 500 });
  }
}
