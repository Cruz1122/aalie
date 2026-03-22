import type { SnapshotLlmComparative } from "@aa/types";

interface RequestLlmComparisonInput {
  source: string;
  locale: "es" | "en";
  apiKey?: string;
  requestOrigin?: string;
  analysis?: unknown;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    const match = value.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/i);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value.map((item) => String(item || "").trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeConfidence(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function extractCandidateText(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined;
  const candidates = data?.candidates as Array<Record<string, unknown>> | undefined;
  const candidate = candidates?.[0];
  const content = candidate?.content as Record<string, unknown> | undefined;
  const parts = content?.parts as Array<Record<string, unknown>> | undefined;
  const text = parts?.[0]?.text;
  return typeof text === "string" ? text : null;
}

export function normalizeLlmComparativePayload(payload: unknown): SnapshotLlmComparative {
  const raw = payload;

  if (!payload || typeof payload !== "object") {
    return { raw };
  }

  const payloadRecord = payload as Record<string, unknown>;
  let parsed = payloadRecord;

  const candidateText = extractCandidateText(payloadRecord);
  if (candidateText) {
    const parsedCandidate = safeJsonParse(candidateText);
    if (parsedCandidate && typeof parsedCandidate === "object") {
      parsed = parsedCandidate as Record<string, unknown>;
    }
  }

  const normalized: SnapshotLlmComparative["normalized"] = {
    verdict:
      typeof parsed.verdict === "string"
        ? parsed.verdict
        : typeof parsed.note === "string"
          ? parsed.note
          : undefined,
    confidence: normalizeConfidence(parsed.confidence),
    matches: toStringArray(parsed.matches) ?? toStringArray(parsed.coincidencias),
    differences: toStringArray(parsed.differences) ?? toStringArray(parsed.diferencias),
    note: typeof parsed.note === "string" ? parsed.note : undefined,
  };

  return {
    raw,
    normalized,
  };
}

function buildPrompt(source: string, analysis: unknown): string {
  const analysisSummary = analysis ? JSON.stringify(analysis, null, 2) : "{}";
  return [
    "Compara el siguiente analisis del sistema con el algoritmo fuente.",
    "Entrega JSON con campos: analysis, note, verdict, confidence, matches, differences.",
    "",
    "ALGORITMO:",
    source,
    "",
    "ANALISIS_DEL_SISTEMA:",
    analysisSummary,
  ].join("\n");
}

export async function requestLlmComparison(
  input: RequestLlmComparisonInput,
): Promise<unknown | null> {
  if (!input.requestOrigin) {
    return null;
  }

  try {
    const response = await fetch(`${input.requestOrigin}/api/llm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job: "compare",
        prompt: buildPrompt(input.source, input.analysis),
        apiKey: input.apiKey,
        locale: input.locale,
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        ok: false,
        error: `LLM request failed with status ${response.status}`,
        data,
      };
    }

    return data;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
