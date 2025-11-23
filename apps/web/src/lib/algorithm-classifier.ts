import type { Program } from "@aa/types";

export type AlgorithmKind = "iterative" | "recursive" | "hybrid" | "unknown";

/**
 * Función heurística para clasificar algoritmos basándose en el AST.
 * 
 * NOTA: Esta función ahora está deprecada en favor de usar el API route directamente.
 * Esta función es solo un fallback y retorna "unknown" para forzar el uso del API route.
 * 
 * El API route `/api/llm/classify` ahora usa el backend Python (fuente única de verdad),
 * por lo que se recomienda usar ese endpoint directamente.
 * 
 * @deprecated Usar el API route `/api/llm/classify` directamente
 * @param _ast - AST del programa parseado o null (no utilizado)
 * @returns "unknown" (siempre, para forzar uso del API route)
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export function heuristicKind(_ast: Program | null | unknown): AlgorithmKind {
  // Esta función está deprecada. El código debe usar el API route /api/llm/classify
  // que ahora usa el backend Python como fuente única de verdad.
  console.warn("[heuristicKind] Esta función está deprecada. Usar el API route /api/llm/classify directamente.");
    return "unknown"; 
}

