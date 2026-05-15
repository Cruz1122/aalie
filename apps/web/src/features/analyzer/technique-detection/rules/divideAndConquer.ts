import type { TechniqueRule } from "./ruleTypes";
import { confidenceFromScore } from "./score";

const BT_CORE_PENALTY = 80;

export const divideAndConquerRule: TechniqueRule = {
  id: "divide_and_conquer",
  priority: 70,

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

    const hasDivideAndConquerCore =
      facts.decomposition.hasStructuralDecomposition &&
      facts.shrink.hasFractionalShrink &&
      facts.decomposition.hasIndependentSubproblems &&
      !facts.mutation.hasUndoAfterRecursiveCall;

    /**
     * Backtracking is identified by reversible mutation of a partial
     * solution around recursive exploration; Divide and Conquer is
     * identified by structural decomposition into independent subproblems
     * and post-recursive combination.
     *
     * Backtracking se identifica por mutaci�n reversible de una soluci�n
     * parcial alrededor de la exploraci�n recursiva; Divide y Vencer�s
     * se identifica por descomposici�n estructural en subproblemas
     * independientes y combinaci�n posterior.
     */
    if (hasBacktrackingCore) {
      score -= BT_CORE_PENALTY;
      diagnostics.push(
        "Backtracking core detected: reversible mutation + feasibility check around recursion.",
      );
    }

    if (hasDivideAndConquerCore) {
      score += 80;
      secondarySignals.push("divide_and_conquer_core");
      for (const call of facts.recursion.calls.slice(0, 6)) {
        evidenceItems.push({
          role: "recursive_call" as const,
          nodeId: call.nodeId,
          importance: "primary" as const,
        });
      }
      diagnostics.push(
        "Divide and Conquer core detected: structural decomposition into independent subproblems.",
      );
    }

    /**
     * Binary search / ternary search: search-by-partition over a
     * fractionally reduced interval with mutually exclusive branches.
     * This is a valid DyV pattern even without co-execution.
     */
    if (
      facts.recursion.summary.hasMutuallyExclusiveSelfCalls &&
      facts.shrink.hasFractionalShrink
    ) {
      score += 45;
      for (const call of facts.recursion.calls) {
        evidenceItems.push({
          role: "recursive_call" as const,
          nodeId: call.nodeId,
          importance: "primary" as const,
        });
      }
      secondarySignals.push("exclusive_interval_partition");
      diagnostics.push(
        "Search by partition over fractionally reduced interval.",
      );

      if (
        facts.recursion.summary.maxSelfCallsOnAnyPath === 1
      ) {
        score += 25;
        secondarySignals.push("single_branch_interval_partition");
      }
    }

    /**
     * Co-executed self-calls (merge-sort, quick-sort, etc.) are the
     * classic DyV pattern.
     */
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
    }

    if (facts.decomposition.branchCount >= 2) {
      score += 15;
    }

    /**
     * Structural decomposition (K-way + shrink, or partition boundary)
     * is a strong DyV signal. Apply it outside the core check so that
     * algorithms like quicksort still get this bonus.
     */
    if (facts.decomposition.hasStructuralDecomposition) {
      score += 20;
      secondarySignals.push("structural_decomposition");
    }

    if (facts.partition.hasPartitionLikeLoop) {
      score += 10;
      secondarySignals.push("partition_like_split");
    }

    if (facts.shrink.hasStrongShrink) {
      score += 15;
      secondarySignals.push("subproblem_shrink");
    }

    if (
      facts.shrink.hasAdditiveShrink &&
      !facts.shrink.hasFractionalShrink &&
      !facts.partition.hasPartitionLikeLoop &&
      !facts.partition.hasNonRecursiveHelperCall
    ) {
      score -= 35;
    }

    if (
      facts.partition.hasNonRecursiveHelperCall &&
      facts.recursion.summary.hasCoExecutedSelfCalls
    ) {
      score += 15;
      secondarySignals.push("external_partition_call");
    }

    if (facts.decomposition.hasPostRecursiveCombine && !hasBacktrackingCore) {
      score += 15;
      secondarySignals.push("post_recursive_combine");
    }

    if (
      facts.recursion.summary.hasMutuallyExclusiveSelfCalls &&
      !facts.recursion.summary.hasCoExecutedSelfCalls &&
      !facts.shrink.hasFractionalShrink
    ) {
      score -= 35;
    }

    /**
     * Co-executed calls with choice from branches suggest B&B-style
     * branching, not DyV. Penalize unless fractional shrink (binary
     * search partition pattern).
     */
    if (
      facts.recursion.summary.hasCoExecutedSelfCalls &&
      facts.choice.hasChoiceEnumerationFromBranches &&
      !facts.shrink.hasFractionalShrink
    ) {
      score -= 35;
      diagnostics.push(
        "Llamadas co-ejecutadas con ramas de selecci�n; posible Branch and Bound, no Divide y Vencer�s.",
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
