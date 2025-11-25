/**
 * Utilidades para manejo de polinomios y notación asintótica.
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */

/**
 * Calcula la notación asintótica Big-O a partir de una expresión polinómica.
 * @param polynomial - Expresión polinómica en formato LaTeX
 * @returns Notación Big-O correspondiente (O(n³), O(n²), O(n), O(log n) o O(1))
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```ts
 * calculateBigO("n^2 + 3n + 5"); // "O(n^2)"
 * calculateBigO("n log(n)"); // "O(\\log n)"
 * ```
 */
export function calculateBigO(polynomial: string): string {
  if (!polynomial) return "O(1)";

  const normalized = polynomial.trim();

  if (normalized.includes("n^3") || normalized.includes("n³")) return "O(n^3)";
  if (normalized.includes("n^2") || normalized.includes("n²")) return "O(n^2)";

  // Verificar si hay 'n' que no sea parte de n^2, n^3, etc.
  const linearPatternStr = String.raw`(^|[^\^])n(?![\w^])`;
  const linearPattern = new RegExp(linearPatternStr);
  if (linearPattern.test(normalized)) return "O(n)";

  const logPatternStr = String.raw`\\log\(n\)|log\(n\)`;
  if (new RegExp(logPatternStr).test(normalized)) return String.raw`O(\log n)`;

  return "O(1)";
}

/**
 * Normaliza un polinomio eliminando términos con coeficiente 0.
 * @param poly - Polinomio en formato LaTeX (opcional)
 * @returns Polinomio normalizado sin términos con coeficiente 0, o "0" si está vacío
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```ts
 * normalizePolynomial("0 \\cdot n^2 + 3n + 0"); // "3n"
 * normalizePolynomial("0 \\cdot n + 0"); // "0"
 * ```
 */
export function normalizePolynomial(poly?: string): string {
  if (!poly) return "";

  // Reemplazar \cdot por espacio y limpiar espacios
  const normalized = poly
    .replaceAll(/\\cdot/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();

  // Separar por + y filtrar términos con "0 *"
  const parts = normalized
    .split("+")
    .map((s) => s.trim())
    .filter((term) => !/^0\s/.test(term));

  // Volver a unir
  return parts.join(" + ") || "0";
}

/**
 * Obtiene el caso seleccionado desde sessionStorage.
 * @returns Caso guardado ('worst', 'average' o 'best'), o 'worst' por defecto
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function getSavedCase(): "worst" | "average" | "best" {
  if (typeof globalThis.window === "undefined") return "worst";

  const saved = globalThis.window.sessionStorage.getItem(
    "analyzerSelectedCase",
  );
  if (saved === "best" || saved === "average" || saved === "worst")
    return saved;

  return "worst";
}

/**
 * Guarda el caso seleccionado en sessionStorage.
 * @param caseType - Tipo de caso a guardar ('worst', 'average' o 'best')
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function saveCase(caseType: "worst" | "average" | "best"): void {
  if (typeof globalThis.window !== "undefined") {
    globalThis.window.sessionStorage.setItem("analyzerSelectedCase", caseType);
  }
}
