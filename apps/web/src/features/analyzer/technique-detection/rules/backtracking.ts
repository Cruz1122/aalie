import type { TechniqueRule } from "./ruleTypes";
import { confidenceFromScore } from "./score";

export const backtrackingRule: TechniqueRule = {
  id: "backtracking",
  priority: 80,

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

    /**
     * Backtracking core: reversible mutation of a partial solution
     * around recursive exploration, guided by feasibility checks.
     * When all five signals fire, it is definitively backtracking.
     */
    if (hasBacktrackingCore) {
      score += 90;
      secondarySignals.push("backtracking_core");
      diagnostics.push(
        "Backtracking core: reversible mutation + feasibility check around recursion.",
      );
    }

    if (facts.recursion.hasSelfCall) score += 15;
    if (facts.choice.hasChoiceEnumeration) score += 10;
    if (facts.mutation.hasMutationBeforeRecursiveCall) score += 10;
    if (facts.mutation.hasUndoAfterRecursiveCall) score += 10;

    if (facts.choice.hasChoiceEnumeration) {
      for (const id of facts.choice.choiceNodeIds.slice(0, 2)) {
        evidenceItems.push({
          role: "choice" as const,
          nodeId: id,
          importance: "primary" as const,
        });
      }
    }

    for (const id of facts.mutation.mutationNodeIds.slice(0, 2)) {
      evidenceItems.push({
        role: "mutation" as const,
        nodeId: id,
        importance: "primary" as const,
      });
    }

    for (const id of facts.mutation.undoNodeIds.slice(0, 2)) {
      evidenceItems.push({
        role: "undo" as const,
        nodeId: id,
        importance: "primary" as const,
      });
    }

    if (!facts.recursion.hasSelfCall) {
      diagnostics.push("No se encontr� llamada recursiva.");
    }

    if (!facts.choice.hasChoiceEnumeration) {
      diagnostics.push("No se encontr� enumeraci�n de decisiones.");
    }

    if (!facts.mutation.hasMutationBeforeRecursiveCall) {
      diagnostics.push("No se encontr� mutaci�n previa a la llamada recursiva.");
    }

    if (!facts.mutation.hasUndoAfterRecursiveCall) {
      diagnostics.push("No se encontr� rollback posterior a la llamada recursiva.");
    }

    return {
      technique: "backtracking",
      matched: score >= 75,
      score,
      confidence: confidenceFromScore(score),
      evidenceItems,
      secondarySignals,
      diagnostics,
    };
  },
};
