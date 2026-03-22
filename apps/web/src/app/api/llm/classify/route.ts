import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ClassifyResponse = {
  kind: "iterative" | "recursive" | "hybrid" | "unknown";
  method?: string;
};
type ClassifyRequest = { source: string; mode?: "llm" | "local" | "auto" };

/**
 * Obtiene la URL base del backend API.
 * Usa API_INTERNAL_BASE_URL en Docker o API_BASE_URL/fallback en desarrollo local.
 */
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

/**
 * Llama al backend Python para clasificar el algoritmo usando AST.
 * Esta es la fuente única de verdad para clasificación.
 */
async function classifyWithBackend(
  source: string,
): Promise<ClassifyResponse["kind"]> {
  const apiBaseUrl = getApiBase();
  const url = `${apiBaseUrl}/classify`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        `[Classify API] Backend error ${response.status}: ${errorText}`,
      );
      throw new Error(
        `Backend error: ${response.status} - ${errorText.substring(0, 100)}`,
      );
    }

    const data = await response.json();

    if (!data || typeof data !== "object") {
      console.error(`[Classify API] Invalid backend response:`, data);
      throw new Error("Backend response is not an object");
    }

    if (data.ok && data.kind) {
      return data.kind as ClassifyResponse["kind"];
    } else {
      console.error(`[Classify API] Backend response invalid:`, data);
      throw new Error(
        `Backend response invalid: ${data.errors?.[0]?.message || "Unknown error"}`,
      );
    }
  } catch (error) {
    console.error(`[Classify API] Error calling backend at ${url}:`, error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Failed to connect to backend at ${url}. Check if the backend is running.`,
      );
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { source, mode } = (await req.json()) as ClassifyRequest;
    if (!source || typeof source !== "string") {
      return NextResponse.json(
        { error: "Source code is required" },
        { status: 400 },
      );
    }

    // Usar backend Python como fuente única de verdad basada en AST
    let kind: ClassifyResponse["kind"];
    let method: string;

    try {
      // El modo LLM está deshabilitado; siempre usar backend Python
      if (mode === "llm") {
        return NextResponse.json(
          {
            error:
              'Classification LLM mode "llm" is disabled. Use mode "local" or omit mode to rely on backend classification.',
          },
          { status: 400 },
        );
      }

      // Por defecto, usar backend Python (fuente única de verdad basada en AST)
      try {
        kind = await classifyWithBackend(source);
        method = "ast";
      } catch (error) {
        // Si falla, intentar de nuevo con mejor logging
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[Classify API] Error inicial en backend: ${errorMessage}`,
        );
        throw error; // Relanzar para que se maneje en el catch externo
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(
        `[Classify API] Error, usando backend Python: ${errorMessage}`,
      );
      try {
        kind = await classifyWithBackend(source);
        method = "ast_error_fallback";
      } catch (fallbackError) {
        // Si el backend también falla, retornar unknown
        console.error(`[Classify API] Backend también falló:`, fallbackError);
        kind = "unknown";
        method = "error";
      }
    }
    return NextResponse.json({
      kind,
      method,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Classify API] Error: ${errorMessage}`);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
