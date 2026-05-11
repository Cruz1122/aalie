import type { TechniqueRule } from "./ruleTypes";
import { confidenceFromScore } from "./score";

export const dpTopDownRule: TechniqueRule = {
  id: "dp_top_down",
  priority: 90,

  evaluate(facts) {
    let score = 0;
    const evidenceItems = [];
    const secondarySignals: string[] = [];
    const diagnostics: string[] = [];

    if (facts.recursion.hasSelfCall) score += 20;

    if (facts.table.hasIndexedReadBeforeRecursiveCall) {
      score += 20;
      secondarySignals.push("indexed_read_before_recursion");
    }

    if (facts.table.hasReturnFromIndexedRead) {
      score += 20;
      secondarySignals.push("early_return_from_stored_state");
    }

    if (facts.table.hasIndexedWriteAfterRecursiveCall) {
      score += 20;
      secondarySignals.push("indexed_write_after_recursive_computation");
    }

    if (facts.table.hasSameStorageReadWrite) {
      score += 20;
      secondarySignals.push("same_storage_read_write_shape");
    } else {
      diagnostics.push(
        "No se logró probar que lectura y escritura pertenezcan al mismo estado.",
      );
    }

    for (const id of facts.table.evidenceNodeIds.slice(0, 2)) {
      evidenceItems.push({
        role: "memo_read" as const,
        nodeId: id,
        importance: "primary" as const,
      });
    }

    for (const id of facts.table.evidenceNodeIds.slice(2, 4)) {
      evidenceItems.push({
        role: "memo_write" as const,
        nodeId: id,
        importance: "secondary" as const,
      });
    }

    return {
      technique: "dp_top_down",
      matched: score >= 75 && facts.recursion.hasSelfCall,
      score,
      confidence: confidenceFromScore(score),
      evidenceItems,
      secondarySignals,
      diagnostics,
    };
  },
};
