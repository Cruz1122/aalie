import type { TechniqueRule } from "./ruleTypes";
import { confidenceFromScore } from "./score";

export const divideAndConquerRule: TechniqueRule = {
  id: "divide_and_conquer",
  priority: 70,

  evaluate(facts) {
    let score = 0;
    const evidenceItems = [];
    const secondarySignals: string[] = [];
    const diagnostics: string[] = [];

    if (facts.recursion.summary.hasCoExecutedSelfCalls) {
      score += 30;
      secondarySignals.push("co_executed_recursive_calls");

      for (const call of facts.recursion.calls.slice(0, 6)) {
        evidenceItems.push({
          role: "recursive_call" as const,
          nodeId: call.nodeId,
          importance: "primary" as const,
        });
      }
    } else {
      diagnostics.push("No hay llamadas recursivas co-ejecutadas.");
    }

    if (facts.decomposition.branchCount >= 2) {
      score += 15;
      secondarySignals.push(
        `k_way_branch_count_${facts.decomposition.branchCount}`,
      );
    }

    if (facts.decomposition.hasStructuralDecomposition) {
      score += 25;
      secondarySignals.push("structural_decomposition");
    }

    if (facts.partition.hasPartitionLikeLoop) {
      score += 10;
      secondarySignals.push("partition_like_split");
      for (const id of facts.partition.evidenceNodeIds.slice(0, 2)) {
        evidenceItems.push({
          role: "partition" as const,
          nodeId: id,
          importance: "secondary" as const,
        });
      }
    }

    if (facts.shrink.hasStrongShrink) {
      score += 15;
      secondarySignals.push("subproblem_shrink");
    }

    if (
      facts.recursion.summary.hasMutuallyExclusiveSelfCalls &&
      facts.shrink.hasFractionalShrink
    ) {
      score += 45;
      secondarySignals.push("exclusive_interval_partition");
      for (const item of facts.shrink.items
        .filter((item) => item.kind === "fractional_shrink")
        .slice(0, 2)) {
        evidenceItems.push({
          role: "split" as const,
          nodeId: item.callNodeId,
          importance: "primary" as const,
          note: item.kind,
        });
      }
      for (const call of facts.recursion.calls.slice(0, 6)) {
        evidenceItems.push({
          role: "recursive_call" as const,
          nodeId: call.nodeId,
          importance: "primary" as const,
        });
      }
      diagnostics.push(
        "La recursión elige una sola rama, pero el intervalo se parte por cortes fraccionales típicos de búsqueda por partición.",
      );
    }

    if (
      facts.recursion.summary.maxSelfCallsOnAnyPath === 1 &&
      facts.recursion.summary.hasMutuallyExclusiveSelfCalls &&
      facts.shrink.hasFractionalShrink
    ) {
      score += 15;
      secondarySignals.push("single_branch_after_interval_split");
    }

    if (
      facts.shrink.hasAdditiveShrink &&
      !facts.shrink.hasFractionalShrink &&
      !facts.partition.hasPartitionLikeLoop &&
      !facts.partition.hasNonRecursiveHelperCall
    ) {
      score -= 35;
      diagnostics.push(
        "La reducción parece aditiva y sin partición; se parece más a expansión recursiva que a Divide y Vencerás.",
      );
    }

    if (
      facts.partition.hasNonRecursiveHelperCall &&
      facts.recursion.summary.hasCoExecutedSelfCalls
    ) {
      score += 15;
      secondarySignals.push("external_partition_call");
    }

    if (facts.decomposition.hasPostRecursiveCombine) {
      score += 15;
      secondarySignals.push("post_recursive_combine");

      for (const id of facts.decomposition.evidenceNodeIds.slice(0, 2)) {
        evidenceItems.push({
          role: "combine" as const,
          nodeId: id,
          importance: "secondary" as const,
        });
      }
    }

    if (
      facts.recursion.summary.hasMutuallyExclusiveSelfCalls &&
      !facts.recursion.summary.hasCoExecutedSelfCalls &&
      !facts.shrink.hasFractionalShrink
    ) {
      score -= 35;
      diagnostics.push(
        "Las llamadas recursivas parecen estar en ramas alternativas.",
      );
    }

    return {
      technique: "divide_and_conquer",
      matched: score >= 70,
      score,
      confidence: confidenceFromScore(score),
      evidenceItems,
      secondarySignals,
      diagnostics,
    };
  },
};
