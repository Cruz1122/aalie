import type { RuleMatch } from "../rules/ruleTypes";

type TranslationValues = Record<
  string,
  string | number | boolean | Date | null | undefined
>;

type TechniqueTranslator = (key: string, values?: TranslationValues) => string;

const DEFAULT_FACTS: Record<string, string> = {
  co_executed_recursive_calls:
    "El bloque contiene varias llamadas recursivas co-ejecutadas.",
  structural_decomposition:
    "La estructura muestra una descomposición real del problema en subproblemas.",
  partition_like_split:
    "Aparece una partición estructural que separa el problema antes de recursar.",
  exclusive_interval_partition:
    "El intervalo se parte con un corte fraccional y luego la recursión continúa por una sola rama.",
  single_branch_after_interval_split:
    "Después de dividir el intervalo, el algoritmo sigue solo por la rama que conserva el subproblema relevante.",
  subproblem_shrink:
    "Cada llamada trabaja sobre una expresión de subproblema más pequeña.",
  post_recursive_combine:
    "Después de resolver los subproblemas aparece una fase de combinación.",
  single_dominant_recursive_call:
    "En cada camino domina una única llamada recursiva.",
  recursive_argument_shrink:
    "La llamada recursiva reduce el tamaño del problema.",
  multiple_co_executed_recursive_calls:
    "Se expanden varias ramas recursivas dentro del mismo camino de ejecución.",
  branching_recursion_tree: "La forma genera un árbol de recursión ramificado.",
  additive_shrink: "La reducción se hace por resta o desplazamiento aditivo.",
  indexed_read_before_recursion:
    "Se consulta una estructura indexada antes de recalcular.",
  early_return_from_stored_state:
    "La ejecución puede retornar directamente un estado ya almacenado.",
  indexed_write_after_recursive_computation:
    "El resultado se escribe en una estructura indexada después del cálculo recursivo.",
  same_storage_read_write_shape:
    "La lectura y la escritura apuntan a la misma forma de estado almacenado.",
  indexed_writes_inside_loop: "Se llenan estados indexados dentro de ciclos.",
  previous_state_dependency:
    "Los estados actuales dependen de valores anteriores.",
  multi_previous_state_transition:
    "La transición usa varios estados previos, no una sola acumulación simple.",
  prune_like_return:
    "Hay una poda estructural que corta ramas antes de seguir explorando.",
  bound_like_comparison:
    "Se detectan comparaciones con forma de cota o umbral.",
};

export function explainEvidence(
  match: RuleMatch,
  t?: TechniqueTranslator,
): string[] {
  const facts = match.secondarySignals
    .map((signal) => translateFact(signal, t))
    .filter((fact): fact is string => Boolean(fact));

  if (facts.length > 0) {
    return facts.slice(0, 4);
  }

  if (match.diagnostics.length > 0) {
    return [match.diagnostics[0]];
  }

  return ["No hay una evidencia pedagógica suficientemente clara todavía."];
}

function translateFact(signal: string, t?: TechniqueTranslator): string | null {
  const exact = DEFAULT_FACTS[signal];
  if (exact) return exact;

  if (signal.startsWith("k_way_branch_count_")) {
    const branchCount = signal.replace("k_way_branch_count_", "");
    return `La descomposición abre ${branchCount} subproblemas en el mismo nivel.`;
  }

  if (t) {
    try {
      return t(`evidenceFacts.${signal}`);
    } catch {
      return null;
    }
  }

  return null;
}
