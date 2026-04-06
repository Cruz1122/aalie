/**
 * Traduce errores crudos del LLM a claves de traducción legibles.
 *
 * Mapea patrones comunes (API key, cuota, timeout, etc.) a mensajes
 * localizados en analyzer.messages.
 *
 * Uso: t(translateLlmError(rawError)) donde t = useTranslations("analyzer.messages")
 *
 * Author: AALIE
 * Version: 0.1.0
 */

/** Claves de traducción para errores de LLM (bajo analyzer.messages) */
export type LlmErrorKey =
  | "llmErrorApiKey"
  | "llmErrorQuota"
  | "llmErrorRateLimit"
  | "llmErrorTimeout"
  | "llmErrorServer"
  | "llmErrorBlocked"
  | "llmErrorUnavailable"
  | "llmErrorGeneric";

/** Patrones que mapean a claves de traducción (orden: más específicos primero) */
const ERROR_PATTERNS: {
  pattern: RegExp | ((s: string) => boolean);
  key: LlmErrorKey;
}[] = [
  { pattern: /LLM_QUOTA_EXCEEDED/i, key: "llmErrorQuota" },
  { pattern: /LLM_RATE_LIMIT/i, key: "llmErrorRateLimit" },
  { pattern: /LLM_TIMEOUT/i, key: "llmErrorTimeout" },
  { pattern: /LLM_SERVER_ERROR/i, key: "llmErrorServer" },
  {
    pattern: /API_KEY|API key|api key|invalid.*key|missing.*key/i,
    key: "llmErrorApiKey",
  },
  {
    pattern: /quota|resource exhausted|RESOURCE_EXHAUSTED|billing/i,
    key: "llmErrorQuota",
  },
  {
    pattern: /rate limit|rate_limit|429|too many requests/i,
    key: "llmErrorRateLimit",
  },
  {
    pattern: /timeout|timed out|deadline exceeded|DEADLINE_EXCEEDED/i,
    key: "llmErrorTimeout",
  },
  {
    pattern: /500|internal server|server error|503|service unavailable/i,
    key: "llmErrorServer",
  },
  {
    pattern: /blocked|blocked_content|SAFETY|content filter/i,
    key: "llmErrorBlocked",
  },
  {
    pattern: /unavailable|connection refused|fetch failed|network/i,
    key: "llmErrorUnavailable",
  },
  { pattern: /Gemini|OpenAI|LLM/i, key: "llmErrorGeneric" },
];

/**
 * Devuelve la clave de traducción para un error de LLM.
 * Si no hay coincidencia, devuelve "unknownLlmError".
 */
export function translateLlmError(rawError: string | undefined | null): string {
  if (!rawError || typeof rawError !== "string") return "unknownLlmError";
  const normalized = rawError.trim();
  if (!normalized) return "unknownLlmError";

  for (const { pattern, key } of ERROR_PATTERNS) {
    const matches =
      typeof pattern === "function"
        ? pattern(normalized)
        : pattern.test(normalized);
    if (matches) return key;
  }

  return "unknownLlmError";
}
