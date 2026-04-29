import type { RecursionFacts } from "./recursionFacts";
import {
  getAssignTarget,
  getChildren,
  kindOf,
  type AstNode,
} from "../ast/astAdapter";
import type { NodeIndex } from "../ast/nodeIdentity";

export type MutationFacts = {
  hasMutationBeforeRecursiveCall: boolean;
  hasUndoAfterRecursiveCall: boolean;
  mutationNodeIds: string[];
  undoNodeIds: string[];
};

export function collectMutationFacts(
  ast: AstNode,
  index: NodeIndex,
  recursion: RecursionFacts,
): MutationFacts {
  const mutationNodeIds: string[] = [];
  const undoNodeIds: string[] = [];

  if (!recursion.hasSelfCall) {
    return {
      hasMutationBeforeRecursiveCall: false,
      hasUndoAfterRecursiveCall: false,
      mutationNodeIds,
      undoNodeIds,
    };
  }

  const statements = flattenStatements(ast);

  for (let i = 0; i < statements.length; i++) {
    const node = statements[i];
    const nodeId = safeId(index, node);
    if (!recursion.calls.some((call) => call.nodeId === nodeId)) continue;

    const before = statements.slice(Math.max(0, i - 5), i);
    const after = statements.slice(i + 1, i + 6);

    const beforeMutation = before.find(isMutation);
    const afterUndo = after.find(isPotentialUndo);

    if (beforeMutation) mutationNodeIds.push(index.idOf(beforeMutation));
    if (afterUndo) undoNodeIds.push(index.idOf(afterUndo));
  }

  return {
    hasMutationBeforeRecursiveCall: mutationNodeIds.length > 0,
    hasUndoAfterRecursiveCall: undoNodeIds.length > 0,
    mutationNodeIds,
    undoNodeIds,
  };
}

function flattenStatements(ast: AstNode): AstNode[] {
  const out: AstNode[] = [];
  const queue = [ast];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (
      ["assign", "call", "return", "if", "for", "while", "repeat"].includes(
        kindOf(node),
      )
    ) {
      out.push(node);
    }
    queue.unshift(...getChildren(node));
  }

  return out;
}

function isMutation(node: AstNode): boolean {
  return kindOf(node) === "assign" && Boolean(getAssignTarget(node));
}

function isPotentialUndo(node: AstNode): boolean {
  return kindOf(node) === "assign";
}

function safeId(index: NodeIndex, node: AstNode): string | null {
  try {
    return index.idOf(node);
  } catch {
    return null;
  }
}
