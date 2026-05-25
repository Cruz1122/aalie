import type { MutationFacts } from "./mutationFacts";
import {
  getCallName,
  getChildren,
  kindOf,
  type AstNode,
} from "../ast/astAdapter";
import { opOf } from "../ast/exprInspect";
import type { NodeIndex } from "../ast/nodeIdentity";

export type ChoiceFacts = {
  hasChoiceEnumeration: boolean;
  hasChoiceEnumerationFromBranches: boolean;
  hasLocalChoice: boolean;
  hasIrreversibleCommit: boolean;
  hasFeasibilityCheck: boolean;
  choiceNodeIds: string[];
};

const FEASIBILITY_PREFIXES = [
  "is",
  "can",
  "has",
  "valid",
  "safe",
  "check",
  "feasible",
  "possible",
  "es",
  "puede",
  "tiene",
  "valido",
  "seguro",
];

function isFeasibilityCallName(name: string): boolean {
  const lower = name.toLowerCase();
  return FEASIBILITY_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

export function collectChoiceFacts(
  ast: AstNode,
  index: NodeIndex,
  mutation: MutationFacts,
): ChoiceFacts {
  const choiceNodeIds: string[] = [];
  const choiceNodeIdsFromBranches: string[] = [];
  let hasFeasibilityCheck = false;
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

  function hasFeasibilityCallInCondition(node: AstNode): boolean {
    const condition = node.condition ?? node.test;
    if (!condition) return false;
    const callNames = collectCallNames(condition);
    if (callNames.some(isFeasibilityCallName)) return true;

    // Also detect patterns like `usado[k] = false` (availability check)
    // and `B[fila][col] != 0` (cell emptiness check) which act as
    // feasibility guards in backtracking algorithms.
    const lhs = (condition as Record<string, unknown>).left as
      | AstNode
      | undefined;
    const rhs = (condition as Record<string, unknown>).right as
      | AstNode
      | undefined;
    const op = opOf(condition);
    if (lhs && rhs && (op === "=" || op === "!=")) {
      const rhsVal = extractLiteralValue(rhs);
      const lhsVal = extractLiteralValue(lhs);
      if (
        rhsVal === "false" ||
        rhsVal === "0" ||
        rhsVal === "f" ||
        lhsVal === "false" ||
        lhsVal === "0" ||
        lhsVal === "f"
      ) {
        return true;
      }
    }
    return false;
  }

  function extractLiteralValue(node: AstNode): string | null {
    const obj = node as Record<string, unknown>;
    if (typeof obj.value === "number") return String(obj.value);
    if (typeof obj.value === "boolean") return String(obj.value);
    if (typeof obj.name === "string") {
      const lower = obj.name.toLowerCase();
      if (
        lower === "false" ||
        lower === "true" ||
        lower === "f" ||
        lower === "v"
      )
        return lower;
    }
    if (typeof obj.raw === "string") return obj.raw;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.sourceText === "string") return obj.sourceText;
    if (obj.expression && typeof obj.expression === "object") {
      return extractLiteralValue(obj.expression as AstNode);
    }
    return null;
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

      if (!hasFeasibilityCheck) {
        for (const child of children) {
          if (kindOf(child) === "if" && hasFeasibilityCallInCondition(child)) {
            hasFeasibilityCheck = true;
            break;
          }
        }
      }
    }

    if (
      kind === "if" &&
      hasReturnDescendant(node) &&
      _hasBoundCondition(node)
    ) {
      choiceNodeIdsFromBranches.push(index.idOf(node));
      if (!hasFeasibilityCheck && hasFeasibilityCallInCondition(node)) {
        hasFeasibilityCheck = true;
      }
    }

    if (kind === "if" && !hasFeasibilityCheck) {
      if (hasFeasibilityCallInCondition(node)) {
        hasFeasibilityCheck = true;
      }
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
    hasFeasibilityCheck,
    choiceNodeIds,
  };
}

function collectCallNames(node: AstNode): string[] {
  const names: string[] = [];
  const stack = [node];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const callName = getCallName(current);
    if (callName) names.push(callName);
    stack.push(...getChildren(current));
  }
  return names;
}
