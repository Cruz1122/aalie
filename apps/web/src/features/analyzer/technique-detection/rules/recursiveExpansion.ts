import type { TechniqueRule } from "./ruleTypes";
import { confidenceFromScore } from "./score";

export const recursiveExpansionRule: TechniqueRule = {
  id: "decrease_and_get_conquered",
  priority: 55,

  evaluate(facts) {
    let score = 0;
    const evidenceItems = [];
    const secondarySignals: string[] = [];
    const diagnostics: string[] = [];

    if (facts.recursion.summary.hasCoExecutedSelfCalls) {
      score += 40;
      secondarySignals.push("multiple_co_executed_recursive_calls");
    }

    if (facts.recursion.summary.maxSelfCallsOnAnyPath >= 2) {
      score += 20;
      secondarySignals.push("branching_recursion_tree");
    }

    if (facts.shrink.hasAdditiveShrink) {
      score += 25;
      secondarySignals.push("additive_shrink");
    } else if (facts.shrink.hasStrongShrink) {
      score += 10;
      diagnostics.push("Hay reducción, pero no parece aditiva clásica.");
    }

    if (
      facts.table.hasIndexedReadBeforeRecursiveCall ||
      facts.table.hasIndexedWriteAfterRecursiveCall
    ) {
      score -= 35;
      diagnostics.push(
        "Hay señales de memoria; no conviene clasificar como expansión no memorizada.",
      );
    }

    if (
      facts.decomposition.hasStructuralDecomposition &&
      facts.shrink.hasFractionalShrink
    ) {
      score -= 30;
      diagnostics.push(
        "La forma se parece más a Divide y Vencerás que a expansión recursiva múltiple.",
      );
    }

    if (
      facts.partition.hasPartitionLikeLoop ||
      facts.partition.hasNonRecursiveHelperCall
    ) {
      score -= 30;
      diagnostics.push(
        "Hay señal de partición; la estructura se parece más a Divide y Vencerás.",
      );
    }

    for (const call of facts.recursion.calls.slice(0, 6)) {
      evidenceItems.push({
        role: "recursive_call" as const,
        nodeId: call.nodeId,
        importance: "primary" as const,
      });
    }

    return {
      technique: "decrease_and_get_conquered",
      matched: score >= 65,
      score,
      confidence: confidenceFromScore(score),
      evidenceItems,
      secondarySignals,
      diagnostics,
    };
  },
};
