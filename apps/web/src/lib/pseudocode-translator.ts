/**
 * Traduce pseudocódigo generado en español al inglés.
 * El backend genera código con keywords en español (FUNCIÓN, SI, RETORNAR, etc.).
 */
const ES_TO_EN: Record<string, string> = {
  "FIN FUNCIÓN": "END FUNCTION",
  FUNCIÓN: "FUNCTION",
  "FIN PARA": "END FOR",
  "// Casos base": "// Base cases",
  "// Caso base": "// Base case",
  caso_base: "base_case",
  "Caso base": "Base case",
  "Inicializar tabla DP": "Initialize DP table",
  "Llenar tabla bottom-up": "Fill table bottom-up",
  "Llenar bottom-up con solo variables auxiliares":
    "Fill bottom-up with auxiliary variables only",
  "Versión optimizada O(1) espacio": "Optimized O(1) space version",
  "Usar solo tres variables auxiliares": "Use only three auxiliary variables",
  "Usar solo dos variables auxiliares": "Use only two auxiliary variables",
  "Usar solo variables auxiliares": "Use auxiliary variables only",
  HASTA: "TO",
  SI: "IF",
  ENTONCES: "THEN",
  RETORNAR: "RETURN",
  PARA: "FOR",
  HACER: "DO",
};

/**
 * Traduce pseudocódigo de español a inglés.
 * @param code - Código en español
 * @param locale - "en" para traducir, "es" para mantener
 */
export function translatePseudocode(
  code: string,
  locale: "en" | "es"
): string {
  if (locale === "es" || !code) return code;

  let result = code;
  // Ordenar por longitud descendente para evitar reemplazos parciales
  const entries = Object.entries(ES_TO_EN).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [es, en] of entries) {
    result = result.split(es).join(en);
  }
  return result;
}
