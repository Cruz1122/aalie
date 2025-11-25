import { NextRequest } from "next/server";

import { LLM_EXPORTABLE_CONFIG } from "../llm-config";

export const runtime = "nodejs";

// Validar formato de API_KEY de Gemini
function validateApiKey(key: string | undefined): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }
  const API_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35,40}$/;
  return API_KEY_REGEX.test(key.trim());
}

export async function GET(_req: NextRequest) {
  try {
    // Verificar si hay API_KEY en las variables de entorno del servidor
    const serverApiKey = process.env.API_KEY;
    const hasServerApiKey = validateApiKey(serverApiKey);

    const status = {
      timestamp: new Date().toISOString(),
      config: LLM_EXPORTABLE_CONFIG,
      jobs: LLM_EXPORTABLE_CONFIG.jobs,
      apiKey: {
        serverAvailable: hasServerApiKey,
        // No exponemos la API_KEY real por seguridad
      },
    };
    return new Response(JSON.stringify({ ok: true, status }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[LLM Status] Error:", error);
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
