import { NextRequest, NextResponse } from "next/server";

const API_URL =
  "https://v1.royalltd.co.ke/lne/api/loans";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        detail:
          "Unable to connect to Loan API.",
      },
      {
        status: 500,
      }
    );
  }
}