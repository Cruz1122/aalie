import type { RecursionFacts } from "./recursionFacts";
import {
  getAssignTarget,
  getAssignValue,
  getChildren,
  kindOf,
  type AstNode,
} from "../ast/astAdapter";
import type { NodeIndex } from "../ast/nodeIdentity";

export type TableFacts = {
  hasIndexedReadBeforeRecursiveCall: boolean;
  hasIndexedWriteAfterRecursiveCall: boolean;
  hasSameStorageReadWrite: boolean;
  hasReturnFromIndexedRead: boolean;
  hasIndexedWritesInsideLoop: boolean;
  hasPreviousStateDependency: boolean;
  hasTransitionFromMultiplePreviousStates: boolean;
  evidenceNodeIds: string[];
};

export function collectTableFacts(
  ast: AstNode,
  index: NodeIndex,
  recursion: RecursionFacts,
): TableFacts {
  const evidenceNodeIds: string[] = [];
  let hasIndexedWritesInsideLoop = false;
  let hasPreviousStateDependency = false;
  let hasTransitionFromMultiplePreviousStates = false;

  const stack = [ast];
  while (stack.length > 0) {
    const node = stack.pop()!;
    const kind = kindOf(node);

    if (kind === "for" || kind === "while" || kind === "repeat") {
      const facts = inspectLoopForTableTransition(node);
      if (facts.hasIndexedWrite) {
        hasIndexedWritesInsideLoop = true;
        evidenceNodeIds.push(index.idOf(node));
      }
      if (facts.hasPreviousDependency) hasPreviousStateDependency = true;
      if (facts.previousDependencyCount >= 2) {
        hasTransitionFromMultiplePreviousStates = true;
      }
    }

    stack.push(...getChildren(node));
  }

  const recursiveMemoFacts = inspectRecursiveMemoShape(
    ast,
    recursion,
    index,
    evidenceNodeIds,
  );

  return {
    ...recursiveMemoFacts,
    hasIndexedWritesInsideLoop,
    hasPreviousStateDependency,
    hasTransitionFromMultiplePreviousStates,
    evidenceNodeIds,
  };
}

function inspectLoopForTableTransition(loopNode: AstNode): {
  hasIndexedWrite: boolean;
  hasPreviousDependency: boolean;
  previousDependencyCount: number;
} {
  let hasIndexedWrite = false;
  let maxDependencyInSingleAssign = 0;
  const stack = getChildren(loopNode);

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (kindOf(node) === "assign") {
      const target = getAssignTarget(node);
      const value = getAssignValue(node);

      if (isIndexedAccess(target)) {
        hasIndexedWrite = true;
        const targetBase = getIndexedBaseName(target);
        const count = collectIndexedReadBases(value).filter(
          (base) => targetBase !== null && base === targetBase,
        ).length;
        if (count > maxDependencyInSingleAssign) {
          maxDependencyInSingleAssign = count;
        }
      }
    }

    stack.push(...getChildren(node));
  }

  return {
    hasIndexedWrite,
    hasPreviousDependency: maxDependencyInSingleAssign > 0,
    previousDependencyCount: maxDependencyInSingleAssign,
  };
}

function inspectRecursiveMemoShape(
  ast: AstNode,
  _recursion: RecursionFacts,
  index: NodeIndex,
  evidenceNodeIds: string[],
): Pick<
  TableFacts,
  | "hasIndexedReadBeforeRecursiveCall"
  | "hasIndexedWriteAfterRecursiveCall"
  | "hasSameStorageReadWrite"
  | "hasReturnFromIndexedRead"
> {
  let hasIndexedReadBeforeRecursiveCall = false;
  let hasIndexedWriteAfterRecursiveCall = false;
  let hasReturnFromIndexedRead = false;

  const stack = [ast];
  while (stack.length > 0) {
    const node = stack.pop()!;
    const kind = kindOf(node);

    if (kind === "if" && countIndexedReads(node.condition ?? node.test) > 0) {
      hasIndexedReadBeforeRecursiveCall = true;
      evidenceNodeIds.push(index.idOf(node));

      const children = getChildren(node);
      if (children.some((child) => kindOf(child) === "return")) {
        hasReturnFromIndexedRead = true;
      }
    }

    if (kind === "assign" && isIndexedAccess(getAssignTarget(node))) {
      hasIndexedWriteAfterRecursiveCall = true;
      evidenceNodeIds.push(index.idOf(node));
    }

    stack.push(...getChildren(node));
  }

  return {
    hasIndexedReadBeforeRecursiveCall,
    hasIndexedWriteAfterRecursiveCall,
    hasSameStorageReadWrite:
      hasIndexedReadBeforeRecursiveCall && hasIndexedWriteAfterRecursiveCall,
    hasReturnFromIndexedRead,
  };
}

function isIndexedAccess(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const node = value as AstNode;
  return Boolean(node.index ?? node.indices ?? node.subscript ?? node.range);
}

function countIndexedReads(value: unknown): number {
  return collectIndexedReadBases(value).length;
}

function collectIndexedReadBases(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];

  const bases: string[] = [];
  const stack = [value as AstNode];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (isIndexedAccess(node)) {
      const base = getIndexedBaseName(node);
      if (base) bases.push(base);
    }
    stack.push(...getChildren(node));
  }

  return bases;
}

function getIndexedBaseName(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  let current = value as AstNode;

  while (current && typeof current === "object") {
    if ((current.type ?? current.kind) === "Identifier" && current.name) {
      return String(current.name);
    }
    current = (current.target ?? current.left ?? null) as AstNode;
  }

  return null;
}
