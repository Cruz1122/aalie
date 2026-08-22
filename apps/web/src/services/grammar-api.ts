import type { GrammarParseRequest, GrammarParseResponse } from "@aa/types";

/**
 * Servicio para llamadas al API de gramática.
 * Gestiona las peticiones HTTP al endpoint de parsing del backend.
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export class GrammarApiService {
  /**
   * Analiza código usando el endpoint de parse.
   *
   * @param input - Código fuente a analizar
   * @returns Promesa que resuelve con la respuesta del parser incluyendo ok, ast, errors
   * Devuelve una respuesta con ok=false si la petición HTTP falla.
   * @author Juan Camilo Cruz Parra (@Cruz1122)
   *
   * @example
   * ```ts
   * const response = await GrammarApiService.parseCode(code);
   * if (response.ok) {
   *   console.log(response.ast);
   * } else {
   *   console.error(response.errors);
   * }
   * ```
   */
  static async parseCode(input: string): Promise<GrammarParseResponse> {
    const req: GrammarParseRequest = { input };

    const response = await fetch("/api/grammar/parse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });

    const payload = (await response.json().catch(() => null)) as
      | Partial<GrammarParseResponse>
      | null;

    if (!response.ok) {
      const message =
        payload?.error || `HTTP error! status: ${response.status}`;
      return {
        ok: false,
        error: message,
        errors: payload?.errors ?? [{ line: 0, column: 0, message }],
        available: payload?.available,
        runtime: payload?.runtime,
      };
    }

    return payload as GrammarParseResponse;
  }
}
