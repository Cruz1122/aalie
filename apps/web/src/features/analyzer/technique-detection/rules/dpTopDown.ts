import type { TechniqueRule } from "./ruleTypes";
import { confidenceFromScore } from "./score";

export const dpTopDownRule: TechniqueRule = {
  id: "dp_top_down",
  priority: 90,

  evaluate(facts) {
    let score = 0;
    const evidenceItems = [];
    const secondarySignals: string[] = [];
    const diagnostics: string[] = [];

    const hasBacktrackingCore =
      facts.choice.hasChoiceEnumeration &&
      facts.choice.hasFeasibilityCheck &&
      facts.mutation.hasMutationBeforeRecursiveCall &&
      facts.mutation.hasUndoAfterRecursiveCall &&
      facts.recursion.hasSelfCall;

    if (facts.recursion.hasSelfCall) score += 20;

    if (facts.table.hasIndexedReadBeforeRecursiveCall) {
      score += 20;
      secondarySignals.push("indexed_read_before_recursion");
    }

    if (facts.table.hasReturnFromIndexedRead) {
      score += 20;
      secondarySignals.push("early_return_from_stored_state");
    }

    if (facts.table.hasIndexedWriteAfterRecursiveCall) {
      score += 20;
      secondarySignals.push("indexed_write_after_recursive_computation");
    }

    if (facts.table.hasSameStorageReadWrite) {
      score += 20;
      secondarySignals.push("same_storage_read_write_shape");
    }

    /**
     * Memo pattern bonus: early return from indexed storage +
     * indexed write + same storage + recursion. This is the classic
     * DP top-down memoization pattern.
     */
    if (
      facts.table.hasReturnFromIndexedRead &&
      facts.table.hasIndexedWriteAfterRecursiveCall &&
      facts.table.hasSameStorageReadWrite
    ) {
      score += 20;
      secondarySignals.push("memo_pattern");
    }

    /**
     * Backtracking core: reversible mutation around recursion with
     * feasibility checks. Indexed read/write on M[fila][col] looks
     * like memoization but is actually visited marking with undo.
     */
    if (hasBacktrackingCore) {
      score -= 80;
      diagnostics.push(
        "Indexed read/write with backtracking core: visited marking with rollback, not memoization.",
      );
    }

    return {
      technique: "dp_top_down",
      matched: score >= 75 && facts.recursion.hasSelfCall,
      score,
      confidence: confidenceFromScore(score),
      evidenceItems,
      secondarySignals,
      diagnostics,
    };
  },
};
