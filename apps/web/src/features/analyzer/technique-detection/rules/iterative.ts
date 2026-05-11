import type { TechniqueRule } from "./ruleTypes";
import { confidenceFromScore } from "./score";

export const iterativeRule: TechniqueRule = {
  id: "iterative",
  priority: 10,

  evaluate(facts) {
    let score = 0;
    const evidenceItems = [];
    const secondarySignals: string[] = [];
    const diagnostics: string[] = [];

    if (!facts.recursion.hasSelfCall) score += 35;
    if (facts.loops.loopCount > 0) score += 35;

    for (const id of facts.loops.loopNodeIds.slice(0, 2)) {
      evidenceItems.push({
        role: "loop" as const,
        nodeId: id,
        importance: "primary" as const,
      });
    }

    return {
      technique: "iterative",
      matched: score >= 50,
      score,
      confidence: confidenceFromScore(score),
      evidenceItems,
      secondarySignals,
      diagnostics,
    };
  },
};
