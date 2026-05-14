import type { TechniqueRule } from "./ruleTypes";
import { confidenceFromScore } from "./score";

export const branchAndBoundRule: TechniqueRule = {
  id: "branch_and_bound",
  priority: 100,

  evaluate(facts) {
    let score = 0;
    const evidenceItems = [];
    const secondarySignals: string[] = [];
    const diagnostics: string[] = [];

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
      evidenceItems.push({
        role: "prune" as const,
        nodeId:
          facts.loops.loopNodeIds[0] ??
          facts.choice.choiceNodeIds[0] ??
          "unknown",
        importance: "secondary" as const,
      });
    }

    if (facts.loops.hasBoundLikeComparison) {
      score += 15;
      secondarySignals.push("bound_like_comparison");
      evidenceItems.push({
        role: "bound" as const,
        nodeId:
          facts.choice.choiceNodeIds[0] ??
          facts.loops.loopNodeIds[0] ??
          "unknown",
        importance: "secondary" as const,
      });
    }

    if (
      !facts.choice.hasChoiceEnumeration &&
      !facts.choice.hasChoiceEnumerationFromBranches
    ) {
      score -= 40;
      diagnostics.push(
        "No se encontró enumeración de opciones propia de búsqueda ramificada.",
      );
    } else if (facts.choice.hasChoiceEnumerationFromBranches) {
      diagnostics.push(
        "Se detectó ramificación IF-based como mecanismo de elección.",
      );
    }

    if (!facts.mutation.hasUndoAfterRecursiveCall) {
      score -= 10;
      diagnostics.push(
        "No se encontró rollback posterior a la exploración recursiva (esperado en B&B).",
      );
    }

    if (!facts.recursion.summary.hasCoExecutedSelfCalls) {
      score -= 30;
      diagnostics.push(
        "Las llamadas recursivas no son co-ejecutadas (patrón de búsqueda binaria, no B&B).",
      );
    }

    if (!hasPruneLikeReturn) {
      diagnostics.push("No se encontró poda clara antes de expandir ramas.");
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
