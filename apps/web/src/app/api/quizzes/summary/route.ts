import { NextResponse } from "next/server";

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

export async function GET() {
  const apiBase = getApiBase();
  try {
    const response = await fetch(`${apiBase}/quizzes/dataset/summary`, {
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    if (data && typeof data === "object") {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(
      { ok: false, error: "Bad backend response" },
      { status: 502 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
