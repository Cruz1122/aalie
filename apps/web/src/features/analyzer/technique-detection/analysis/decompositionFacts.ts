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
  evidenceNodeIds: string[];
};

export function collectDecompositionFacts(
  _ast: AstNode,
  _index: NodeIndex,
  recursion: RecursionFacts,
  shrink: ShrinkFacts,
  partition: PartitionFacts,
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

  return {
    branchCount,
    hasKWayDecomposition,
    hasStructuralDecomposition,
    hasPostRecursiveCombine,
    evidenceNodeIds: recursion.calls.map((call) => call.nodeId).slice(0, 8),
  };
}
