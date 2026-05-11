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

    if (facts.recursion.hasSelfCall) score += 20;
    if (facts.choice.hasChoiceEnumeration) score += 20;
    if (facts.mutation.hasMutationBeforeRecursiveCall) score += 25;
    if (facts.mutation.hasUndoAfterRecursiveCall) score += 25;

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

    if (!facts.mutation.hasUndoAfterRecursiveCall) {
      diagnostics.push(
        "No se encontró rollback posterior a la llamada recursiva.",
      );
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
