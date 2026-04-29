import type { RecursionFacts } from "./recursionFacts";
import {
  getAssignTarget,
  getAssignValue,
  getCallName,
  getChildren,
  kindOf,
  type AstNode,
} from "../ast/astAdapter";
import { opOf } from "../ast/exprInspect";
import type { NodeIndex } from "../ast/nodeIdentity";

export type PartitionFacts = {
  hasPartitionLikeLoop: boolean;
  hasBoundaryUpdate: boolean;
  hasIndexedSwapOrRelocation: boolean;
  recursiveCallsAroundBoundary: boolean;
  hasNonRecursiveHelperCall: boolean;
  evidenceNodeIds: string[];
};

export function collectPartitionFacts(
  ast: AstNode,
  index: NodeIndex,
  recursion: RecursionFacts,
): PartitionFacts {
  const evidenceNodeIds: string[] = [];
  let hasPartitionLikeLoop = false;
  let hasBoundaryUpdate = false;
  let hasIndexedSwapOrRelocation = false;
  let hasNonRecursiveHelperCall = false;

  const stack = [ast];
  while (stack.length > 0) {
    const node = stack.pop()!;
    const kind = kindOf(node);

    if (kind === "for" || kind === "while") {
      const bodyFacts = inspectPartitionLoopBody(getChildren(node));
      if (bodyFacts.hasCondition && bodyFacts.hasIndexedAssignment) {
        hasPartitionLikeLoop = true;
        evidenceNodeIds.push(index.idOf(node));
      }
      if (bodyFacts.hasBoundaryUpdate) hasBoundaryUpdate = true;
      if (bodyFacts.hasIndexedAssignment) hasIndexedSwapOrRelocation = true;
    }

    if (kind === "call") {
      const callName = getCallName(node);
      if (callName && callName !== recursion.procedureName) {
        hasNonRecursiveHelperCall = true;
      }
    }

    stack.push(...getChildren(node));
  }

  return {
    hasPartitionLikeLoop,
    hasBoundaryUpdate,
    hasIndexedSwapOrRelocation,
    hasNonRecursiveHelperCall,
    recursiveCallsAroundBoundary:
      recursion.summary.hasCoExecutedSelfCalls &&
      hasPartitionLikeLoop &&
      hasBoundaryUpdate,
    evidenceNodeIds,
  };
}

function inspectPartitionLoopBody(nodes: AstNode[]): {
  hasCondition: boolean;
  hasBoundaryUpdate: boolean;
  hasIndexedAssignment: boolean;
} {
  let hasCondition = false;
  let hasBoundaryUpdate = false;
  let hasIndexedAssignment = false;
  const stack = [...nodes];

  while (stack.length > 0) {
    const node = stack.pop()!;
    const kind = kindOf(node);

    if (kind === "if") hasCondition = true;

    if (kind === "assign") {
      const target = getAssignTarget(node);
      const value = getAssignValue(node);

      if (target && isIndexedAccess(target)) hasIndexedAssignment = true;
      if (value && (opOf(value) === "+" || opOf(value) === "-")) {
        hasBoundaryUpdate = true;
      }
    }

    stack.push(...getChildren(node));
  }

  return { hasCondition, hasBoundaryUpdate, hasIndexedAssignment };
}

function isIndexedAccess(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const node = value as AstNode;
  return Boolean(node.index ?? node.indices ?? node.subscript ?? node.range);
}
