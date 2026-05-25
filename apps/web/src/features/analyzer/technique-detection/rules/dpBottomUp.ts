import type { TechniqueRule } from "./ruleTypes";
import type { EvidenceItem } from "../types";
import { confidenceFromScore } from "./score";

export const dpBottomUpRule: TechniqueRule = {
  id: "dp_bottom_up",
  priority: 50,

  evaluate(facts) {
    let score = 0;
    const evidenceItems: EvidenceItem[] = [];
    const secondarySignals: string[] = [];
    const diagnostics: string[] = [];

    if (!facts.recursion.hasSelfCall) score += 15;
    if (facts.loops.loopCount > 0) score += 15;

    if (facts.table.hasIndexedWritesInsideLoop) {
      score += 20;
      secondarySignals.push("indexed_writes_inside_loop");
    }

    if (facts.table.hasPreviousStateDependency) {
      score += 20;
      secondarySignals.push("previous_state_dependency");
    }

    if (facts.table.hasTransitionFromMultiplePreviousStates) {
      score += 25;
      secondarySignals.push("multi_previous_state_transition");
    } else {
      score -= 20;
      diagnostics.push(
        "La dependencia parece simple; podría ser acumulación o conteo, no DP bottom-up.",
      );
    }

    for (const id of facts.table.evidenceNodeIds.slice(0, 4)) {
      evidenceItems.push({
        role: "transition" as const,
        nodeId: id,
        importance: "primary" as const,
      });
    }

    return {
      technique: "dp_bottom_up",
      matched: score >= 70,
      score,
      confidence: confidenceFromScore(score),
      evidenceItems,
      secondarySignals,
      diagnostics,
    };
  },
};
