import type { MutationFacts } from "./mutationFacts";
import type { PartitionFacts } from "./partitionFacts";
import type { RecursionFacts } from "./recursionFacts";
import type { ShrinkFacts } from "./shrinkFacts";
import type { AstNode } from "../ast/astAdapter";
import type { NodeIndex } from "../ast/nodeIdentity";

export type DecompositionFacts = {
  branchCount: number;
  hasKWayDecomposition: boolean;
  hasStructuralDecomposition: boolean;
  hasPostRecursiveCombine: boolean;
  hasIndependentSubproblems: boolean;
  evidenceNodeIds: string[];
};

export function collectDecompositionFacts(
  _ast: AstNode,
  _index: NodeIndex,
  recursion: RecursionFacts,
  shrink: ShrinkFacts,
  partition: PartitionFacts,
  mutation: MutationFacts,
): DecompositionFacts {
  const branchCount = recursion.summary.maxSelfCallsOnAnyPath;

  const hasKWayDecomposition =
    recursion.summary.hasCoExecutedSelfCalls &&
    branchCount >= 2 &&
    shrink.hasStrongShrink;

  const hasStructuralDecomposition =
    hasKWayDecomposition || partition.recursiveCallsAroundBoundary;

  const hasPostRecursiveCombine =
    recursion.summary.hasSelfCallsInSameExpression ||
    recursion.summary.hasCoExecutedSelfCalls;

  const hasIndependentSubproblems =
    recursion.summary.hasCoExecutedSelfCalls &&
    !mutation.hasUndoAfterRecursiveCall;

  return {
    branchCount,
    hasKWayDecomposition,
    hasStructuralDecomposition,
    hasPostRecursiveCombine,
    hasIndependentSubproblems,
    evidenceNodeIds: recursion.calls.map((call) => call.nodeId).slice(0, 8),
  };
}
