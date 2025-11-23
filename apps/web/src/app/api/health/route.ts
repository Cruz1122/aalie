// path: apps/web/src/app/api/health/route.ts
import type { HealthResponse } from "@aa/types";
import { NextResponse } from "next/server";

function getApiBase(): string {
  const a = process.env.API_INTERNAL_BASE_URL?.replace(/\/+$/, "");
  if (a) {
    return a.startsWith('http://') || a.startsWith('https://') ? a : `https://${a}`;
  }
  const b = process.env.API_BASE_URL?.replace(/\/+$/, "");
  if (b) {
    return b.startsWith('http://') || b.startsWith('https://') ? b : `https://${b}`;
  }
  return process.env.DOCKER ? "http://api:8000" : "http://localhost:8000";
}

export async function GET() {
  const API_BASE = getApiBase();

  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });

    // Intentamos JSON primero; si falla, usamos texto
    const upstreamOk = res.ok;
    let ok = false;
    let parseErr: string | null = null;

    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = (await res.json()) as { status?: string; ok?: boolean };
        // Aceptamos varios “OK” convencionales
        const status = (data.status || "").toString().toLowerCase();
        ok = Boolean(
          data.ok === true || status === "ok" || status === "healthy" || status === "up",
        );
      } else {
        const text = (await res.text()).trim().toLowerCase();
        ok = text === "ok";
      }
    } catch (e: unknown) {
      parseErr = String(e instanceof Error ? e.message : String(e));
    }

    const body: HealthResponse =
      upstreamOk && ok
        ? { ok: true, service: "api" }
        : {
            ok: false,
            error:
              parseErr ?? `Upstream ${API_BASE}/health responded ${res.status} ${res.statusText}`,
          };

    return NextResponse.json(body, { status: body.ok ? 200 : 502 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const body: HealthResponse = { ok: false, error: message };
    return NextResponse.json(body, { status: 503 });
  }
}
