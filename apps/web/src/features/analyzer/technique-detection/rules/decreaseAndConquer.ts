import type { TechniqueRule } from "./ruleTypes";
import { confidenceFromScore } from "./score";

export const decreaseAndConquerRule: TechniqueRule = {
  id: "decrease_and_conquer",
  priority: 60,

  evaluate(facts) {
    let score = 0;
    const evidenceItems = [];
    const secondarySignals: string[] = [];
    const diagnostics: string[] = [];

    if (facts.recursion.hasSelfCall) score += 20;

    if (facts.recursion.summary.maxSelfCallsOnAnyPath === 1) {
      score += 35;
      secondarySignals.push("single_dominant_recursive_call");
    } else {
      diagnostics.push(
        "No hay una única llamada recursiva dominante por camino.",
      );
    }

    if (facts.shrink.hasStrongShrink) {
      score += 35;
      secondarySignals.push("recursive_argument_shrink");

      for (const item of facts.shrink.items.slice(0, 3)) {
        evidenceItems.push({
          role: "recursive_call" as const,
          nodeId: item.callNodeId,
          importance: "primary" as const,
          note: item.kind,
        });
      }
    }

    if (
      facts.recursion.summary.hasMutuallyExclusiveSelfCalls &&
      facts.shrink.hasFractionalShrink
    ) {
      score -= 30;
      diagnostics.push(
        "La reducción parece venir de una partición fraccional de intervalo, más propia de Divide y Vencerás.",
      );
    }

    if (
      facts.table.hasIndexedReadBeforeRecursiveCall &&
      facts.table.hasIndexedWriteAfterRecursiveCall
    ) {
      score -= 25;
      diagnostics.push("Hay señales de memoización; podría ser DP top-down.");
    }

    // If the algorithm has choice enumeration + mutation + undo (backtracking signals),
    // it should not be classified as decrease and conquer
    if (
      facts.choice.hasChoiceEnumeration &&
      facts.mutation.hasMutationBeforeRecursiveCall &&
      facts.mutation.hasUndoAfterRecursiveCall
    ) {
      score -= 40;
      diagnostics.push(
        "Se detectan señales de backtracking (elección + mutación + rollback).",
      );
    }

    // If the algorithm has B&B semantic cues (bound, cota, mejor, etc.),
    // it is likely B&B, not decrease and conquer
    if (facts.semantic.hasBranchAndBoundCue) {
      score -= 30;
      diagnostics.push(
        "Se detectaron señales semánticas de Branch and Bound (cota, bound, mejor, etc.).",
      );
    }

    return {
      technique: "decrease_and_conquer",
      matched: score >= 65,
      score,
      confidence: confidenceFromScore(score),
      evidenceItems,
      secondarySignals,
      diagnostics,
    };
  },
};
