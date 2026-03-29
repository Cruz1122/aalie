/**
 * Utilidades para manejo de polinomios y notación asintótica.
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */

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
