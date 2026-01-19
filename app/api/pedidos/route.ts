import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, status: "healthy" });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { ok: false, error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    const pedido = await req.json();

    const response = await fetch(
      "https://webhook.fiqon.app/webhook/9fa66806-5665-4e43-9c1e-04bfb4d1ac1f/3eca6995-6353-4dd1-819a-5da6835b1fcd",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido),
      }
    );

    if (!response.ok) {
      let bodyText = "";
      try {
        bodyText = await response.text();
      } catch {}
      return NextResponse.json(
        {
          ok: false,
          error: "Webhook request failed",
          status: response.status,
          body: bodyText || undefined,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, recebido: pedido });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}


