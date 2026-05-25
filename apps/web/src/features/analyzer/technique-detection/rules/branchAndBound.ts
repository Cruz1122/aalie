import type { TechniqueRule } from "./ruleTypes";
import type { EvidenceItem } from "../types";
import { confidenceFromScore } from "./score";

const BACKTRACKING_PENALTY = 80;

export const branchAndBoundRule: TechniqueRule = {
  id: "branch_and_bound",
  priority: 100,

  evaluate(facts) {
    let score = 0;
    const evidenceItems: EvidenceItem[] = [];
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
     * Backtracking core: reversible mutation + feasibility check.
     * If this matches AND the algorithm has explicit B&B semantic cues
     * (bound/incumbent/priorityQueue/cota), it is legitimately B&B,
     * not plain backtracking.
     */
    if (hasBacktrackingCore && facts.semantic.hasBranchAndBoundCue) {
      score += 40;
      secondarySignals.push("backtracking_with_bound_semantics");
      diagnostics.push(
        "Backtracking structure with explicit bound/incumbent semantics; classified as Branch and Bound.",
      );
    }

    if (hasBacktrackingCore && !facts.semantic.hasBranchAndBoundCue) {
      score -= BACKTRACKING_PENALTY;
      diagnostics.push(
        "Backtracking core detected without explicit bound/incumbent cues; penalized as Branch and Bound.",
      );
    }

    /**
     * Divide and Conquer core: structural decomposition + fractional shrink
     * + independent subproblems. If this matches, it's definitely not B&B.
     */
    if (hasDivideAndConquerCore) {
      score -= 80;
      diagnostics.push(
        "Divide and Conquer core detected; not Branch and Bound.",
      );
    }

    if (facts.recursion.hasSelfCall) score += 15;
    if (facts.choice.hasChoiceEnumeration) score += 20;
    if (facts.choice.hasChoiceEnumerationFromBranches) score += 20;
    if (facts.mutation.hasMutationBeforeRecursiveCall) score += 20;
    if (facts.mutation.hasUndoAfterRecursiveCall) score += 20;

    const hasPruneLikeReturn =
      facts.recursion.summary.totalSelfCallSites > 0 &&
      facts.loops.hasConditionalReturn;

    if (hasPruneLikeReturn) {
      score += 15;
      secondarySignals.push("prune_like_return");
    }

    if (facts.loops.hasBoundLikeComparison) {
      score += 15;
      secondarySignals.push("bound_like_comparison");
    }

    if (facts.semantic.hasBranchAndBoundCue) {
      score += 25;
      secondarySignals.push("branch_and_bound_semantic_cue");
    }

    if (
      !facts.choice.hasChoiceEnumeration &&
      !facts.choice.hasChoiceEnumerationFromBranches
    ) {
      score -= 40;
      diagnostics.push("No hay enumeraci�n de decisiones ni ramas candidatas.");
    }

    if (
      facts.shrink.hasFractionalShrink &&
      !facts.mutation.hasMutationBeforeRecursiveCall
    ) {
      score -= 20;
      diagnostics.push(
        "Reducci�n fraccional sin mutaci�n; patr�n de b�squeda por partici�n, no Branch and Bound.",
      );
    }

    if (!facts.mutation.hasUndoAfterRecursiveCall) {
      score -= 10;
    }

    if (!facts.recursion.summary.hasCoExecutedSelfCalls) {
      score -= 15;
    }

    if (
      facts.table.hasReturnFromIndexedRead &&
      facts.table.hasSameStorageReadWrite
    ) {
      score -= 35;
    }

    return {
      technique: "branch_and_bound",
      matched: score >= 70,
      score,
      confidence: confidenceFromScore(score),
      evidenceItems: evidenceItems.filter((item) => item.nodeId !== "unknown"),
      secondarySignals,
      diagnostics,
    };
  },
};
