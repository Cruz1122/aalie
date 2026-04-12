import { NextRequest } from "next/server";

export const runtime = "nodejs";

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

export async function GET(_req: NextRequest) {
  try {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/llm/status`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);
    if (data && typeof data === "object") {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: false,
        error: `Bad backend response (${response.status})`,
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      },
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[LLM Status Proxy] Error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
