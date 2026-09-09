import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_BASE_URL =
  process.env.DJANGO_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
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

    const targetUrl = `${API_BASE_URL.replace(/\/$/, "")}/loans/${id}/appraise/`;
    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`POST /api/loans/[id]/appraise error:`, error);
    return NextResponse.json(
      { error: "Failed to appraise loan", detail: error?.message },
      { status: 500 }
    );
  }
}
