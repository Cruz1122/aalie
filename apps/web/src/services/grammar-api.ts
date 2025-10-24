import type { GrammarParseRequest, GrammarParseResponse } from "@aa/types";

/**
 * Servicio para llamadas al API de gramática
 */
export class GrammarApiService {
  /**
   * Analiza código usando el endpoint de parse
   * @param input - Código a analizar
   * @returns Respuesta del parser con información sobre si es válido o no
   */
  static async parseCode(input: string): Promise<GrammarParseResponse> {
    const req: GrammarParseRequest = { input };
    
    const response = await fetch("/api/grammar/parse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

