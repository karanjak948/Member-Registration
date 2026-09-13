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

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/ledger-accounts/`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error in POST /api/ledger-accounts:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

