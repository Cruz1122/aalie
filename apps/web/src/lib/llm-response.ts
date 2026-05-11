export interface NormalizedLlmResponse<TStructured = unknown> {
  ok?: boolean;
  job?: string;
  provider?: string;
  model?: string;
  requestId?: string;
  error?: string;
  errorCode?: string;
  data?: {
    text?: string;
    structured?: TStructured;
    metadata?: {
      responseId?: string;
      modelVersion?: string;
      finishReason?: string | null;
      usage?: unknown;
    };
  };
}

export function getNormalizedLlmText(result: unknown): string {
  const payload = result as NormalizedLlmResponse | null | undefined;
  const text = payload?.data?.text;
  return typeof text === "string" ? text.trim() : "";
}

export function getNormalizedLlmStructured<
  TStructured = Record<string, unknown>,
>(result: unknown): TStructured | null {
  const payload = result as
    | NormalizedLlmResponse<TStructured>
    | null
    | undefined;
  const structured = payload?.data?.structured;
  if (!structured || typeof structured !== "object") {
    return null;
  }
  return structured;
}

export function parseJsonFromText<TStructured = Record<string, unknown>>(
  text: string,
): TStructured | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as TStructured;
    return parsed;
  } catch {
    const codeBlockMatch = trimmed.match(
      /```(?:json|pseudocode)?\s*([\s\S]*?)```/i,
    );
    if (codeBlockMatch?.[1]) {
      try {
        return JSON.parse(codeBlockMatch[1].trim()) as TStructured;
      } catch {
        return null;
      }
    }
  }

  return null;
}
