import type { MutationFacts } from "./mutationFacts";
import { getChildren, kindOf, type AstNode } from "../ast/astAdapter";
import { opOf } from "../ast/exprInspect";
import type { NodeIndex } from "../ast/nodeIdentity";

export type ChoiceFacts = {
  hasChoiceEnumeration: boolean;
  hasChoiceEnumerationFromBranches: boolean;
  hasLocalChoice: boolean;
  hasIrreversibleCommit: boolean;
  choiceNodeIds: string[];
};

export function collectChoiceFacts(
  ast: AstNode,
  index: NodeIndex,
  mutation: MutationFacts,
): ChoiceFacts {
  const choiceNodeIds: string[] = [];
  const choiceNodeIdsFromBranches: string[] = [];
  const stack = [ast];

  function flattenBody(node: AstNode): AstNode[] {
    const raw = node.body ?? node.statements ?? node.children;
    if (Array.isArray(raw)) return raw as AstNode[];
    if (raw && typeof raw === "object") {
      const inner = (raw as Record<string, unknown>).body;
      if (Array.isArray(inner)) return inner as AstNode[];
    }
    return [];
  }

  function _hasBoundCondition(node: AstNode): boolean {
    const condition =
      (node as Record<string, unknown>).condition ??
      (node as Record<string, unknown>).test;
    if (condition && typeof condition === "object") {
      const op = opOf(condition as AstNode);
      return op === "<" || op === "<=" || op === ">" || op === ">=";
    }
    return false;
  }

  function hasReturnDescendant(node: AstNode): boolean {
    const children = getChildren(node);
    for (const child of children) {
      if (kindOf(child) === "return") return true;
      if (hasReturnDescendant(child)) return true;
    }
    return false;
  }

  while (stack.length > 0) {
    const node = stack.pop()!;
    const kind = kindOf(node);

    if (kind === "for" || kind === "while") {
      const children = flattenBody(node);
      const hasIfInside = children.some((child) => kindOf(child) === "if");
      if (hasIfInside) {
        choiceNodeIds.push(index.idOf(node));
      }
    }

    if (
      kind === "if" &&
      hasReturnDescendant(node) &&
      _hasBoundCondition(node)
    ) {
      choiceNodeIdsFromBranches.push(index.idOf(node));
    }

    stack.push(...getChildren(node));
  }

  const hasMultipleBranchChoices = choiceNodeIdsFromBranches.length >= 2;
  if (hasMultipleBranchChoices) {
    choiceNodeIds.push(...choiceNodeIdsFromBranches);
  }

  return {
    hasChoiceEnumeration: choiceNodeIds.length > 0,
    hasChoiceEnumerationFromBranches: hasMultipleBranchChoices,
    hasLocalChoice: choiceNodeIds.length > 0,
    hasIrreversibleCommit:
      mutation.hasMutationBeforeRecursiveCall &&
      !mutation.hasUndoAfterRecursiveCall,
    choiceNodeIds,
  };
}
