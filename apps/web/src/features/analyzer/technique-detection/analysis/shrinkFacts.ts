import {
  getAssignValue,
  getChildren,
  kindOf,
  type AstNode,
} from "../ast/astAdapter";
import { opOf } from "../ast/exprInspect";
import type { NodeIndex } from "../ast/nodeIdentity";
import type { EvidenceLevel } from "../types";
import type { RecursionFacts } from "./recursionFacts";

export type ShrinkKind =
  | "constant_decrement"
  | "constant_increment"
  | "fractional_shrink"
  | "modulo_shrink"
  | "interval_inward_shrink"
  | "subrange_shrink"
  | "unknown";

export type ShrinkEvidence = {
  callId: string;
  callNodeId: string;
  argIndex: number;
  kind: ShrinkKind;
  level: EvidenceLevel;
};

export type ShrinkFacts = {
  items: ShrinkEvidence[];
  hasStrongShrink: boolean;
  hasFractionalShrink: boolean;
  hasAdditiveShrink: boolean;
  hasModuloShrink: boolean;
};

export function collectShrinkFacts(
  ast: AstNode,
  index: NodeIndex,
  recursion: RecursionFacts,
): ShrinkFacts {
  const items: ShrinkEvidence[] = [];

  for (const call of recursion.calls) {
    call.args.forEach((arg, argIndex) => {
      const kind = classifyShrinkExpression(arg);
      if (kind !== "unknown") {
        items.push({
          callId: call.id,
          callNodeId: call.nodeId,
          argIndex,
          kind,
          level: "strong",
        });
      }
    });
  }

  const stack = [ast];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (kindOf(node) === "assign") {
      const kind = classifyShrinkExpression(getAssignValue(node) ?? node);
      if (
        kind === "fractional_shrink" ||
        kind === "modulo_shrink" ||
        kind === "subrange_shrink"
      ) {
        items.push({
          callId: "derived",
          callNodeId: index.idOf(node),
          argIndex: -1,
          kind,
          level: "medium",
        });
      }
    }
    stack.push(...getChildren(node));
  }

  return {
    items,
    hasStrongShrink: items.some((item) => item.level === "strong"),
    hasFractionalShrink: items.some(
      (item) => item.kind === "fractional_shrink",
    ),
    hasAdditiveShrink: items.some(
      (item) =>
        item.kind === "constant_decrement" ||
        item.kind === "constant_increment",
    ),
    hasModuloShrink: items.some((item) => item.kind === "modulo_shrink"),
  };
}

function classifyShrinkExpression(expr: AstNode): ShrinkKind {
  const op = opOf(expr);

  if (op === "DIV" || op === "/") return "fractional_shrink";
  if (op === "MOD") return "modulo_shrink";

  if (expr.range) return "subrange_shrink";

  if (op === "-" || op === "+") {
    if (expr.left) {
      const leftKind = classifyShrinkExpression(expr.left as AstNode);
      if (leftKind === "fractional_shrink") return "fractional_shrink";
    }
    return op === "-" ? "constant_decrement" : "constant_increment";
  }

  return "unknown";
}
