import type { GrammarParseRequest, GrammarParseResponse } from "@aa/types";
import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  const API_BASE = getApiBase();

  // 1) Leer body con forma { input: string }
  const body: GrammarParseRequest = { input: "" };
  try {
    const parsed = (await req.json()) as Partial<GrammarParseRequest>;
    if (typeof parsed.input === "string") body.input = parsed.input;
  } catch {
    // body inválido ⇒ enviamos igual al backend con input vacío
  }

  // 2) Llamar al backend
  try {
    const r = await fetch(`${API_BASE}/grammar/parse`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    // Intentar parsear JSON del backend
    const data = (await r.json().catch(() => null)) as GrammarParseResponse | null;

    if (data && typeof data.ok === "boolean" && data.runtime === "python") {
      // Passthrough del contrato tipado del backend (conservando status)
      return NextResponse.json(data, { status: r.status });
    }

    // Backend respondió con forma inesperada
    const fallback: GrammarParseResponse = {
      ok: false,
      available: false,
      runtime: "python",
      error: `Bad backend response (${r.status})`,
    };
    return NextResponse.json(fallback, { status: 502 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const down: GrammarParseResponse = {
      ok: false,
      available: false,
      runtime: "python",
      error: msg,
    };
    return NextResponse.json(down, { status: 503 });
  }
}