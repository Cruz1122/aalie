import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getApiBase(): string {
  const configured = process.env.API_INTERNAL_BASE_URL?.replace(/\/+$/, "");
  if (configured) {
    return configured.startsWith("http://") || configured.startsWith("https://")
      ? configured
      : `https://${configured}`;
  }

  const fallback = process.env.API_BASE_URL?.replace(/\/+$/, "");
  if (fallback) {
    return fallback.startsWith("http://") || fallback.startsWith("https://")
      ? fallback
      : `https://${fallback}`;
  }

  return process.env.DOCKER ? "http://api:8000" : "http://localhost:8000";
}

const PASSTHROUGH_HEADERS = [
  "content-type",
  "content-disposition",
  "content-length",
  "x-snapshot-id",
  "x-content-hash",
] as const;

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${getApiBase()}/export/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    });

    const headers = new Headers();
    for (const name of PASSTHROUGH_HEADERS) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "El servicio de exportación no está disponible." },
      { status: 503 },
    );
  }
}
