/**
 * Utilidades para cache del subsistema trace.
 * Normalización de fuente, construcción de clave y versión del contrato.
 *
 * @author Plan refactor subsistema trace (Bloque H)
 * @version 0.1.0
 */

/** Versión del contrato de trace. Incrementar cuando cambie el formato del response. */
export const TRACE_CONTRACT_VERSION = "2.2";

export const TRACE_CACHE_KEY_PREFIX = "analyzerTraceCache";
export const TRACE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

export interface TraceCacheKeyParams {
  source: string;
  case: "best" | "avg" | "worst";
  inputSize: number;
  initialVariablesOverride?: Record<string, unknown> | null;
  locale: string;
}

/**
 * Normaliza el pseudocódigo para construir claves de cache consistentes.
 * - Espacios redundantes → espacio único
 * - Saltos de línea triviales → newline único
 * - Comentarios de línea (//) y bloque (/* *\/) removidos si no afectan semántica
 */
export function normalizeSource(source: string): string {
  if (!source || typeof source !== "string") return "";
  let s = source
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  // Remover comentarios de bloque /* ... */
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remover comentarios de línea // ...
  s = s.replace(/\/\/[^\n]*/g, "");
  // Colapsar espacios múltiples
  s = s.replace(/[ \t]+/g, " ");
  // Trim por línea, filtrar vacías, unir con espacio (normalización canónica)
  s = s
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  return s;
}

/**
 * Hash djb2 simple y determinista para claves de cache.
 */
function djb2Hash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

/**
 * Serializa initialVariablesOverride de forma determinista (claves ordenadas).
 */
function serializeVariables(v?: Record<string, unknown> | null): string {
  if (!v || typeof v !== "object") return "";
  try {
    const keys = Object.keys(v).sort();
    const obj: Record<string, unknown> = {};
    for (const k of keys) {
      obj[k] = v[k];
    }
    return JSON.stringify(obj);
  } catch {
    return "";
  }
}

/**
 * Construye la clave de cache del trace.
 * Invalida cuando cambie: source, case, inputSize, initialVariablesOverride,
 * locale o versión del contrato.
 */
export function buildTraceCacheKey(params: TraceCacheKeyParams): string {
  const normalized = normalizeSource(params.source);
  const payload = [
    normalized,
    params.case,
    String(params.inputSize),
    serializeVariables(params.initialVariablesOverride ?? null),
    params.locale,
    TRACE_CONTRACT_VERSION,
  ].join("|");
  const hash = djb2Hash(payload);
  return `${TRACE_CACHE_KEY_PREFIX}:${hash}`;
}
