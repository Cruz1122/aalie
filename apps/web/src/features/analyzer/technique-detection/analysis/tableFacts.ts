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
  let maxDependencyInSingleAssign = 0;
  const varDeps: Map<string, Map<string, number>> = new Map();
  const indexedWrites: Array<{
    targetBase: string | null;
    value: AstNode | null;
  }> = [];

  function getVarBaseCount(name: string, base: string): number {
    return varDeps.get(name)?.get(base) ?? 0;
  }

  function resolveDeps(
    value: AstNode | null,
    targetBase: string | null,
  ): number {
    if (!value) return 0;
    const direct =
      targetBase !== null
        ? collectIndexedReadBases(value).filter((b) => b === targetBase).length
        : 0;

    if (kindOf(value) === "expr" && value.name) {
      const varName = String(value.name);
      return direct + getVarBaseCount(varName, targetBase ?? "");
    }

    return direct;
  }

  const stack = getChildren(loopNode);

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (kindOf(node) === "assign") {
      const target = getAssignTarget(node);
      const value = getAssignValue(node);
      const targetName = isSimpleIdentifier(target);

      if (targetName && value) {
        const readBases = collectIndexedReadBases(value);
        if (readBases.length > 0) {
          const deps = new Map<string, number>();
          for (const base of readBases) {
            deps.set(base, (deps.get(base) ?? 0) + 1);
          }
          varDeps.set(targetName, deps);
        }
      }

      if (isIndexedAccess(target)) {
        const targetBase = getIndexedBaseName(target);
        indexedWrites.push({ targetBase, value });
      }
    }

    stack.push(...getChildren(node));
  }

  const hasIndexedWrite = indexedWrites.length > 0;
  for (const { targetBase, value } of indexedWrites) {
    const count = resolveDeps(value, targetBase);
    if (count > maxDependencyInSingleAssign) {
      maxDependencyInSingleAssign = count;
    }
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

function isSimpleIdentifier(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const node = value as AstNode;
  if ((node.type ?? node.kind) === "Identifier" && node.name) {
    return String(node.name);
  }
  return null;
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
