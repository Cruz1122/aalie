import type { TechniqueRule } from "./ruleTypes";
import { confidenceFromScore } from "./score";

export const greedyRule: TechniqueRule = {
  id: "greedy",
  priority: 40,

  evaluate(facts) {
    let score = 0;
    const evidenceItems = [];
    const secondarySignals: string[] = [];
    const diagnostics: string[] = [];

    if (!facts.recursion.hasSelfCall) score += 15;
    if (facts.loops.loopCount > 0) score += 15;
    if (facts.choice.hasLocalChoice) score += 25;
    if (facts.choice.hasIrreversibleCommit) score += 25;

    if (facts.table.hasPreviousStateDependency) {
      score -= 25;
      diagnostics.push(
        "Hay dependencia de estados previos; podría no ser voraz.",
      );
    }

    if (facts.partition.hasPartitionLikeLoop) {
      score -= 20;
      diagnostics.push(
        "La selección local parece parte de una partición, no de una decisión voraz.",
      );
    }

    for (const id of facts.choice.choiceNodeIds.slice(0, 2)) {
      evidenceItems.push({
        role: "choice" as const,
        nodeId: id,
        importance: "primary" as const,
      });
    }

    return {
      technique: "greedy",
      matched: score >= 70,
      score,
      confidence: confidenceFromScore(Math.min(score, 75)),
      evidenceItems,
      secondarySignals,
      diagnostics,
    };
  },
};
