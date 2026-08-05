import { NextRequest, NextResponse } from "next/server";

const API_URL =
  "https://v1.royalltd.co.ke/lne/api/loan-products";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

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

/*
|--------------------------------------------------------------------------
| PUT
|--------------------------------------------------------------------------
*/

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const body = await request.json();

    console.log("Updating Product:", id);
    console.log(body);

    const response = await fetch(
      `${API_URL}/${id}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Loan Product Update Error:",
      error
    );

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