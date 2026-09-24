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
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL.replace(/\/$/, "")}/loan-products/${id}/toggle-status/${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => ({}));
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL.replace(/\/$/, "")}/loan-products/${id}/toggle-status/${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Server error" }, { status: 500 });
  }
}
