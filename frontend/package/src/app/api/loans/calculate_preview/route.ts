import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_BASE_URL =
  process.env.DJANGO_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => ({}));

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

    const targetUrl = `${API_BASE_URL.replace(/\/$/, "")}/loans/calculate_preview/`;
    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`POST /api/loans/calculate_preview error:`, error);
    return NextResponse.json(
      { error: "Failed to calculate preview", detail: error?.message },
      { status: 500 }
    );
  }
}
