import type { RecursionFacts } from "./recursionFacts";
import {
  getAssignTarget,
  getAssignValue,
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

type MutationEvent = {
  node: AstNode;
  nodeId: string;
  order: number;
  base: string | null;
  valueText: string;
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

  const events = statements
    .map((node, order) => ({ node, order }))
    .filter((item) => kindOf(item.node) === "assign")
    .map(({ node, order }) => ({
      node,
      nodeId: index.idOf(node),
      order,
      base: getMutationBase(node),
      valueText: stringifyNodeSafe(getAssignValue(node)),
    }));

  const callNodeIds = new Set(
    recursion.calls.map((call) => call.nodeId),
  );

  const statementContainsCall = (node: AstNode): boolean => {
    const stack = [node];
    let found = false;
    while (stack.length > 0) {
      const current = stack.pop()!;
      const id = safeId(index, current);
      if (callNodeIds.has(id)) {
        found = true;
        break;
      }
      stack.push(...getChildren(current));
    }
    return found;
  };

  const callStatementOrders = statements
    .map((node, order) => ({ node, order }))
    .filter(({ node }) => statementContainsCall(node));

  for (const call of callStatementOrders) {
    const before = events.filter(
      (event) => event.order < call.order && event.order >= call.order - 8,
    );

    const after = events.filter(
      (event) => event.order > call.order && event.order <= call.order + 8,
    );

    for (const mutation of before) {
      if (!mutation.base) continue;

      const undo = after.find(
        (candidate) =>
          candidate.base === mutation.base &&
          isUndoLikeValue(candidate.valueText),
      );

      if (undo) {
        mutationNodeIds.push(mutation.nodeId);
        undoNodeIds.push(undo.nodeId);
      }
    }
  }

  /**
   * Fallback for algorithms where the statement order is non-linear
   * (e.g., mutation before a loop, undo after, call inside the loop).
   * Match by base name across the entire procedure.
   */
  if (!mutationNodeIds.length) {
    const baseToMutation = new Map<string, string>();
    const baseToUndo = new Map<string, string>();

    for (const event of events) {
      if (!event.base) continue;
      if (isUndoLikeValue(event.valueText)) {
        baseToUndo.set(event.base, event.nodeId);
      } else {
        baseToMutation.set(event.base, event.nodeId);
      }
    }

    for (const [base, mutationId] of baseToMutation) {
      const undoId = baseToUndo.get(base);
      if (undoId) {
        mutationNodeIds.push(mutationId);
        undoNodeIds.push(undoId);
      }
    }
  }

  return {
    hasMutationBeforeRecursiveCall: mutationNodeIds.length > 0,
    hasUndoAfterRecursiveCall: undoNodeIds.length > 0,
    mutationNodeIds: [...new Set(mutationNodeIds)],
    undoNodeIds: [...new Set(undoNodeIds)],
  };
}

function flattenStatements(ast: AstNode): AstNode[] {
  const out: AstNode[] = [];
  const queue = [ast];

  while (queue.length > 0) {
    const node = queue.shift()!;
    const kind = kindOf(node);

    if (
      ["assign", "call", "return", "if", "for", "while", "repeat"].includes(kind)
    ) {
      out.push(node);
    }

    queue.unshift(...getChildren(node));
  }

  return out;
}

function getMutationBase(node: AstNode): string | null {
  const target = getAssignTarget(node);
  if (!target) return null;

  return getBaseFromIndexChain(target as Record<string, unknown>);
}

function getBaseFromIndexChain(obj: Record<string, unknown>): string | null {
  if (typeof obj.name === "string") return obj.name;
  if (typeof obj.identifier === "string") return obj.identifier;

  const deeper =
    obj.target ??
    obj.object ??
    obj.value ??
    obj.base ??
    null;

  if (deeper && typeof deeper === "object") {
    return getBaseFromIndexChain(deeper as Record<string, unknown>);
  }

  if (obj.variable && typeof obj.variable === "object") {
    const v = obj.variable as Record<string, unknown>;
    return getBaseFromIndexChain(v);
  }

  return null;
}

function isUndoLikeValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return (
    normalized === "0" ||
    normalized === "false" ||
    normalized === "f" ||
    normalized === "null" ||
    normalized === "vacio" ||
    normalized === "empty"
  );
}

function extractNodeValue(node: unknown): unknown {
  if (!node || typeof node !== "object") return node;

  const obj = node as Record<string, unknown>;

  if (typeof obj.value === "number" || typeof obj.value === "boolean") {
    return obj.value;
  }
  if (typeof obj.value === "string") return obj.value;
  if (obj.name && typeof obj.name === "string") return obj.name as string;
  if (obj.text && typeof obj.text === "string") return obj.text as string;
  if (obj.raw && typeof obj.raw === "string") return obj.raw as string;
  if (obj.sourceText && typeof obj.sourceText === "string") return obj.sourceText as string;

  if (obj.expression && typeof obj.expression === "object") {
    return extractNodeValue(obj.expression);
  }
  if (obj.value && typeof obj.value === "object") {
    return extractNodeValue(obj.value);
  }

  return node;
}

function stringifyNodeSafe(node: unknown): string {
  if (node === null || node === undefined) return "";

  if (typeof node === "string") return node;
  if (typeof node === "number" || typeof node === "boolean") return String(node);

  const extracted = extractNodeValue(node);
  if (extracted !== node) return stringifyNodeSafe(extracted);

  try {
    return JSON.stringify(node);
  } catch {
    return "";
  }
}

function safeId(index: NodeIndex, node: AstNode): string {
  try {
    return index.idOf(node);
  } catch {
    return "unknown";
  }
}
