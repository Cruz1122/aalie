import { NextRequest } from "next/server";

export const runtime = "nodejs";

// ============== ENDPOINT DE ESTADO ==============

export async function GET(req: NextRequest) {
  try {
    const LLM_MODE = (process.env.LLM_MODE as 'LOCAL' | 'REMOTE') || 'REMOTE';
    
    const status = {
      mode: LLM_MODE,
      timestamp: new Date().toISOString(),
      config: {
        local: {
          endpoint: process.env.LM_STUDIO_ENDPOINT || "http://localhost:1234/v1",
          apiKey: process.env.LM_STUDIO_API_KEY || "lm-studio",
          model: "qwen/qwen3-4b-2507",
        },
        remote: {
          endpoint: "https://models.github.ai/inference",
          hasToken: !!process.env.GITHUB_TOKEN,
          models: ["gpt-5-nano", "grok-3-mini"]
        }
      },
      jobs: {
        classify: LLM_MODE === 'LOCAL' ? 'qwen/qwen3-4b-2507' : 'grok-3-mini',
        parser_assist: LLM_MODE === 'LOCAL' ? 'qwen/qwen3-4b-2507' : 'gpt-5-nano',
        general: LLM_MODE === 'LOCAL' ? 'qwen/qwen3-4b-2507' : 'gpt-5-nano'
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
