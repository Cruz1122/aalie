import type { AstNode } from "./astAdapter";

export type ExprOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "DIV"
  | "MOD"
  | "<"
  | "<="
  | ">"
  | ">="
  | "="
  | "!="
  | "AND"
  | "OR"
  | "UNKNOWN";

export function opOf(expr: AstNode): ExprOp {
  const raw = String(
    expr.operator ?? expr.op ?? expr.kind ?? expr.type ?? "",
  ).toUpperCase();

  if (raw === "+") return "+";
  if (raw === "-") return "-";
  if (raw === "*") return "*";
  if (raw === "/") return "/";
  if (raw === "DIV") return "DIV";
  if (raw === "MOD" || raw === "MODULO") return "MOD";
  if (raw === "<") return "<";
  if (raw === "<=" || raw === "≤") return "<=";
  if (raw === ">") return ">";
  if (raw === ">=" || raw === "≥") return ">=";
  if (raw === "=" || raw === "==" || raw === "BINARY")
    return raw === "BINARY" ? "UNKNOWN" : "=";
  if (raw === "!=" || raw === "<>" || raw === "≠") return "!=";
  if (raw === "AND") return "AND";
  if (raw === "OR") return "OR";

  return "UNKNOWN";
}

export function getExprChildren(expr: AstNode | null | undefined): AstNode[] {
  if (!expr || typeof expr !== "object") return [];

  const out: AstNode[] = [];
  const keys = [
    "left",
    "right",
    "operand",
    "expression",
    "arg",
    "index",
    "start",
    "end",
    "indices",
    "args",
    "arguments",
  ];

  for (const key of keys) {
    const value = expr[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object") out.push(item as AstNode);
      }
    } else if (value && typeof value === "object") {
      out.push(value as AstNode);
    }
  }

  if (expr.range?.start && typeof expr.range.start === "object") {
    out.push(expr.range.start);
  }
  if (expr.range?.end && typeof expr.range.end === "object") {
    out.push(expr.range.end);
  }

  return out;
}

export function containsCallTo(
  expr: AstNode | null,
  procedureName: string,
): boolean {
  if (!expr) return false;

  const stack = [expr];
  while (stack.length > 0) {
    const node = stack.pop()!;
    const rawKind = String(node.kind ?? node.type ?? "").toLowerCase();
    const idName =
      typeof node.id === "string"
        ? node.id
        : typeof node.id === "object"
          ? node.id?.name
          : null;
    const callName = node.callee ?? node.name ?? node.identifier ?? idName;

    if (rawKind.includes("call") && callName === procedureName) return true;
    stack.push(...getExprChildren(node));
  }

  return false;
}

export function countCallsTo(
  expr: AstNode | null,
  procedureName: string,
): number {
  if (!expr) return 0;

  let count = 0;
  const stack = [expr];

  while (stack.length > 0) {
    const node = stack.pop()!;
    const rawKind = String(node.kind ?? node.type ?? "").toLowerCase();
    const idName =
      typeof node.id === "string"
        ? node.id
        : typeof node.id === "object"
          ? node.id?.name
          : null;
    const callName = node.callee ?? node.name ?? node.identifier ?? idName;

    if (rawKind.includes("call") && callName === procedureName) count++;
    stack.push(...getExprChildren(node));
  }

  return count;
}
