import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://v1.royalltd.co.ke/lne/api/loan-products",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },

        // Always fetch fresh data
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          message: "Failed to fetch loan products.",
          status: response.status,
        },
        {
          status: response.status,
        }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Loan Products Proxy Error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to connect to Loan API.",
      },
      {
        status: 500,
      }
    );
  }
}