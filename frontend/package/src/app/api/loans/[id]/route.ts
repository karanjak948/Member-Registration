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

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/loans/${id}/`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    // Handle status transition actions (e.g. approve, disburse, reject)
    let url = `${API_BASE_URL.replace(/\/$/, "")}/loans/${id}/`;
    let method = "PUT";

    if (body.status === "appraised") {
      url = `${API_BASE_URL.replace(/\/$/, "")}/loans/${id}/appraise/`;
      method = "POST";
    } else if (body.status === "approved") {
      url = `${API_BASE_URL.replace(/\/$/, "")}/loans/${id}/approve/`;
      method = "POST";
    } else if (body.status === "rejected") {
      url = `${API_BASE_URL.replace(/\/$/, "")}/loans/${id}/reject/`;
      method = "POST";
    } else if (body.status === "active" || body.disbursement_date) {
      url = `${API_BASE_URL.replace(/\/$/, "")}/loans/${id}/disburse/`;
      method = "POST";
    }

    const response = await fetch(url, {
      method,
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
  return PUT(request, { params });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const headers: Record<string, string> = {};
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/loans/${id}/`, {
      method: "DELETE",
      headers,
    });

    return new NextResponse(null, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Server error" }, { status: 500 });
  }
}