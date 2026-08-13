import { NextRequest, NextResponse } from "next/server";

const API_URL =
  "https://v1.royalltd.co.ke/lne/api/loan-products";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/* -------------------------------------------------------------------------- */
/* GET */
/* -------------------------------------------------------------------------- */

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // ✅ MUST await params in Next.js 16
    const { id } = await params;

    console.log("GET Loan Product:", id);

    const response = await fetch(
      `${API_URL}/${id}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    console.log("Loan Product Response:", data);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("GET Loan Product Error:", error);

    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      {
        status: 500,
      }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* PUT */
/* -------------------------------------------------------------------------- */

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // ✅ MUST await params in Next.js 16
    const { id } = await params;

    const body = await request.json();

    console.log("=================================");
    console.log("Updating Loan Product");
    console.log("Product ID:", id);
    console.log("Payload:");
    console.dir(body, { depth: null });
    console.log("=================================");

    const response = await fetch(
      `${API_URL}/${id}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const responseText = await response.text();

    console.log("Royal API Status:", response.status);
    console.log("Royal API Response:", responseText);

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        detail: responseText,
      };
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("PUT Loan Product Error:", error);

    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      {
        status: 500,
      }
    );
  }
}