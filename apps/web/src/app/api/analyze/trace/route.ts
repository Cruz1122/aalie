import { NextRequest, NextResponse } from "next/server";

function getApiBase(): string {
  const a = process.env.API_INTERNAL_BASE_URL?.replace(/\/+$/, "");
  if (a) {
    return a.startsWith("http://") || a.startsWith("https://")
      ? a
      : `https://${a}`;
  }
  const b = process.env.API_BASE_URL?.replace(/\/+$/, "");
  if (b) {
    return b.startsWith("http://") || b.startsWith("https://")
      ? b
      : `https://${b}`;
  }
  return process.env.DOCKER ? "http://api:8000" : "http://localhost:8000";
}

export async function POST(request: NextRequest) {
  const API_BASE = getApiBase();

  try {
    const body = await request.json();
    const { source, case: caseType, input_size, initial_variables } = body;
    
    if (!source) {
      return NextResponse.json(
        {
          ok: false,
          errors: [
            {
              message: "Se requiere el código fuente",
              line: null,
              column: null,
            },
          ],
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_BASE}/analyze/trace`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source,
        case: caseType || "worst",
        input_size: input_size || null,
        initial_variables: initial_variables || null,
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (data && typeof data === "object") {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(
      {
        ok: false,
        errors: [
          {
            message: `Bad backend response (${response.status})`,
            line: null,
            column: null,
          },
        ],
      },
      { status: 502 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Trace API] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        errors: [
          {
            message: msg,
            line: null,
            column: null,
          },
        ],
      },
      { status: 503 },
    );
  }
}
