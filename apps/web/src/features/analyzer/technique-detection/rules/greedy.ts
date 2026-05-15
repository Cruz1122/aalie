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

    /**
     * Greedy iterativo conocido:
     * Activity selection, fractional knapsack, Huffman, Kruskal, Prim, Dijkstra.
     *
     * Estructuralmente se parecen a algoritmos iterativos comunes. Sin una señal
     * semántica mínima, el detector no puede distinguirlos de bubble/insertion.
     */
    if (
      !facts.recursion.hasSelfCall &&
      facts.loops.loopCount > 0 &&
      facts.semantic.hasGreedyCue
    ) {
      score += 40;
      secondarySignals.push("greedy_semantic_cue");
    }

    for (const id of facts.choice.choiceNodeIds.slice(0, 2)) {
      evidenceItems.push({
        role: "choice" as const,
        nodeId: id,
        importance: "primary" as const,
      });
    }

    /**
     * La dependencia de estado anterior normalmente baja confianza de greedy,
     * pero Dijkstra/Prim sí tienen tablas de dist/key y siguen siendo greedy.
     */
    if (
      facts.table.hasPreviousStateDependency &&
      !facts.semantic.hasGreedyCue
    ) {
      score -= 25;
    }

    if (facts.partition.hasPartitionLikeLoop) {
      score -= 20;
    }

    return {
      technique: "greedy",
      matched: score >= 70,
      score,
      confidence: confidenceFromScore(Math.min(score, 85)),
      evidenceItems,
      secondarySignals,
      diagnostics,
    };
  },
};
