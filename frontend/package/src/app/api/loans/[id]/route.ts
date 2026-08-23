import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ROYAL_API_URL =
  process.env.LOAN_API_URL ||
  process.env.NEXT_PUBLIC_LOAN_API_URL ||
  "https://v1.royalltd.co.ke/lne/api";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id: loanId } = await params;

    console.log(`Fetching loan ${loanId} from Royal API...`);

    const response = await fetch(`${ROYAL_API_URL}/loans/${loanId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      console.error(`Royal API returned non-JSON response for loan ${loanId}:`, text.substring(0, 200));

      return NextResponse.json(
        {
          error: "Loan not found",
          detail: `Loan with ID ${loanId} does not exist`,
        },
        { status: 404 },
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch loan",
          detail: data?.detail || response.statusText,
        },
        { status: response.status },
      );
    }

    console.log(`Loan ${loanId} fetched successfully`);
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(`Error fetching loan:`, error);
    return NextResponse.json(
      {
        error: "Unable to connect to Loan API",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id: loanId } = await params;
    const body = await request.json();

    // Server-Side Authorization Check
    const session = await getServerSession(authOptions);
    const userPermissions = ((session?.user as any)?.permissions ?? []) as string[];
    const isSuperuser = Boolean((session?.user as any)?.isSuperuser);
    const roleName = ((session?.user as any)?.role?.name?.toUpperCase() ?? "");

    const isSystemAdmin = isSuperuser || roleName === "SUPERADMIN" || roleName === "OWNER";

    // 1. Approval Gate
    if (body.status === "approved" && !isSystemAdmin && !userPermissions.includes("approve_loans")) {
      return NextResponse.json(
        {
          error: "Forbidden",
          detail: "Access denied. You do not have permission to approve loan applications.",
        },
        { status: 403 },
      );
    }

    // 2. Disbursement Gate
    if (body.status === "active" && !isSystemAdmin && !userPermissions.includes("disburse_loans")) {
      return NextResponse.json(
        {
          error: "Forbidden",
          detail: "Access denied. You do not have permission to disburse loan funds.",
        },
        { status: 403 },
      );
    }

    // 3. Rejection Gate
    if (
      body.status === "rejected" &&
      !isSystemAdmin &&
      !userPermissions.includes("reject_loans") &&
      !userPermissions.includes("approve_loans")
    ) {
      return NextResponse.json(
        {
          error: "Forbidden",
          detail: "Access denied. You do not have permission to reject loan applications.",
        },
        { status: 403 },
      );
    }

    console.log(`Updating loan ${loanId} on Royal API with:`, body);

    const response = await fetch(`${ROYAL_API_URL}/loans/${loanId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const rawResponseText = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(rawResponseText);
    } catch {
      jsonData = { detail: rawResponseText };
    }

    if (!response.ok) {
      console.error(`Royal API PUT error for loan ${loanId}:`, rawResponseText);
      return NextResponse.json(
        {
          error: "Failed to update loan status",
          detail: jsonData.detail || rawResponseText || response.statusText,
        },
        { status: response.status },
      );
    }

    console.log(`Loan ${loanId} updated successfully:`, jsonData);
    return NextResponse.json(jsonData, { status: response.status });
  } catch (error) {
    console.error("Error in PUT /api/loans/[id]:", error);
    return NextResponse.json(
      {
        error: "Unable to connect to Loan API",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  return PUT(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id: loanId } = await params;

    // Server-Side Authorization Check
    const session = await getServerSession(authOptions);
    const userPermissions = ((session?.user as any)?.permissions ?? []) as string[];
    const isSuperuser = Boolean((session?.user as any)?.isSuperuser);
    const roleName = ((session?.user as any)?.role?.name?.toUpperCase() ?? "");

    const isSystemAdmin = isSuperuser || roleName === "SUPERADMIN" || roleName === "OWNER";

    if (!isSystemAdmin && !userPermissions.includes("delete_loans")) {
      return NextResponse.json(
        {
          error: "Forbidden",
          detail: "Access denied. You do not have permission to delete loan records.",
        },
        { status: 403 },
      );
    }

    console.log(`Deleting loan ${loanId} on Royal API...`);

    const response = await fetch(`${ROYAL_API_URL}/loans/${loanId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          error: "Failed to delete loan",
          detail: text || response.statusText,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/loans/[id]:", error);
    return NextResponse.json(
      {
        error: "Unable to connect to Loan API",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}