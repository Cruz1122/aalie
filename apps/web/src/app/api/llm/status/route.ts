import { NextRequest } from "next/server";
import { LLM_EXPORTABLE_CONFIG, LLMMode } from "../llm-config";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const LLM_MODE = (process.env.LLM_MODE as LLMMode) || 'REMOTE';
    const status = {
      mode: LLM_MODE,
      timestamp: new Date().toISOString(),
      config: LLM_EXPORTABLE_CONFIG,
      jobs: {
        classify: LLM_MODE === 'LOCAL' ? LLM_EXPORTABLE_CONFIG.local.model : LLM_EXPORTABLE_CONFIG.jobs.classify,
        parser_assist: LLM_MODE === 'LOCAL' ? LLM_EXPORTABLE_CONFIG.local.model : LLM_EXPORTABLE_CONFIG.jobs.parser_assist,
        general: LLM_MODE === 'LOCAL' ? LLM_EXPORTABLE_CONFIG.local.model : LLM_EXPORTABLE_CONFIG.jobs.general
      }
    };
    return new Response(JSON.stringify({ ok: true, status }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[LLM Status] Error:", error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}


