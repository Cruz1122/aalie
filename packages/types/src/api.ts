/** Contratos TS (deben reflejar Pydantic en apps/api/app/schemas). */

export interface HealthResponse {
  ok: boolean;
  service?: string;
  error?: string;
}

export interface GrammarParseRequest {
  /** Cadena a parsear por la gramática. */
  input: string;
}

export interface GrammarParseResponse {
  /** True si el parse fue válido. */
  ok: boolean;
  /** True si el runtime de gramática (Py) está disponible. */
  available: boolean;
  /** Identificador del runtime del backend. */
  runtime: "python";
  /** Error opcional. */
  error?: string | null;
}

/** Type guard simple para respuestas del backend. */
export function isGrammarParseResponse(x: unknown): x is GrammarParseResponse {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.ok === "boolean" &&
    typeof o.available === "boolean" &&
    o.runtime === "python"
  );
}
