import type { SourceRange } from "../types";

export type AstNode = {
  type?: string;
  kind?: string;
  nodeType?: string;
  name?: string;
  identifier?: string;
  callee?: string;
  id?: { name?: string } | string;
  body?: AstNode[] | AstNode;
  statements?: AstNode[];
  children?: AstNode[];
  thenBranch?: AstNode[] | AstNode;
  elseBranch?: AstNode[] | AstNode;
  consequent?: AstNode[] | AstNode;
  alternate?: AstNode[] | AstNode;
  thenBody?: AstNode[] | AstNode;
  elseBody?: AstNode[] | AstNode;
  args?: AstNode[];
  arguments?: AstNode[];
  params?: AstNode[];
  dims?: AstNode[];
  condition?: AstNode;
  test?: AstNode;
  expression?: AstNode;
  value?: AstNode;
  target?: AstNode;
  left?: AstNode;
  right?: AstNode;
  arg?: AstNode;
  start?: AstNode;
  end?: AstNode;
  index?: AstNode;
  indices?: AstNode[];
  subscript?: AstNode;
  range?: {
    start: AstNode;
    end: AstNode;
    startLine?: number;
    endLine?: number;
  };
  loc?: { start?: { line?: number }; end?: { line?: number } };
  pos?: { line?: number; column?: number };
  operator?: string;
  op?: string;
  var?: string;
  sourceText?: string;
  text?: string;
  raw?: string;
  startLine?: number;
  endLine?: number;
  [key: string]: unknown;
};

export type NormalizedNodeKind =
  | "program"
  | "procedure"
  | "block"
  | "if"
  | "for"
  | "while"
  | "repeat"
  | "assign"
  | "call"
  | "return"
  | "expr"
  | "unknown";

export function kindOf(node: AstNode | null | undefined): NormalizedNodeKind {
  if (!node) return "unknown";

  const raw = String(
    node.kind ?? node.type ?? node.nodeType ?? "",
  ).toLowerCase();

  if (raw.includes("program")) return "program";
  if (
    raw.includes("procedure") ||
    raw.includes("function") ||
    raw === "procdef"
  )
    return "procedure";
  if (raw.includes("block")) return "block";
  if (raw === "if" || raw.includes("ifstatement")) return "if";
  if (raw.includes("for")) return "for";
  if (raw.includes("while")) return "while";
  if (raw.includes("repeat")) return "repeat";
  if (raw.includes("assign")) return "assign";
  if (raw.includes("call")) return "call";
  if (raw.includes("return")) return "return";
  if (
    raw.includes("binary") ||
    raw.includes("unary") ||
    raw.includes("literal") ||
    raw.includes("identifier") ||
    raw.includes("index") ||
    raw.includes("field")
  ) {
    return "expr";
  }

  return "unknown";
}

export function getChildren(node: AstNode): AstNode[] {
  const out: AstNode[] = [];

  const pushNode = (value: unknown) => {
    if (value && typeof value === "object") {
      out.push(value as AstNode);
    }
  };

  const pushArray = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object") out.push(item as AstNode);
      }
    }
  };

  pushArray(node.body);
  pushArray(node.statements);
  pushArray(node.children);
  pushArray(node.thenBranch);
  pushArray(node.elseBranch);
  const consequentNode =
    node.consequent && !Array.isArray(node.consequent)
      ? node.consequent
      : undefined;
  const alternateNode =
    node.alternate && !Array.isArray(node.alternate)
      ? node.alternate
      : undefined;

  pushArray(consequentNode?.body);
  pushArray(alternateNode?.body);
  pushArray(node.consequent);
  pushArray(node.alternate);
  pushArray(node.args);
  pushArray(node.arguments);
  pushArray(node.params);
  pushArray(node.dims);

  pushNode(node.body);
  pushNode(node.consequent);
  pushNode(node.alternate);
  pushNode(node.thenBody);
  pushNode(node.elseBody);
  pushNode(node.condition);
  pushNode(node.test);
  pushNode(node.expression);
  pushNode(node.value);
  pushNode(node.target);
  pushNode(node.left);
  pushNode(node.right);
  pushNode(node.arg);
  pushNode(node.start);
  pushNode(node.end);
  pushNode(node.index);
  pushNode(node.range?.start);
  pushNode(node.range?.end);

  return out;
}

export function getProcedureName(node: AstNode): string | null {
  const idName =
    typeof node.id === "string"
      ? node.id
      : typeof node.id === "object"
        ? node.id?.name
        : null;
  return node.name ?? node.identifier ?? idName ?? null;
}

export function getCallName(node: AstNode): string | null {
  const idName =
    typeof node.id === "string"
      ? node.id
      : typeof node.id === "object"
        ? node.id?.name
        : null;
  return node.callee ?? node.name ?? node.identifier ?? idName ?? null;
}

export function getCallArgs(node: AstNode): AstNode[] {
  return node.args ?? node.arguments ?? node.params ?? [];
}

export function getReturnExpr(node: AstNode): AstNode | null {
  return node.expression ?? node.value ?? null;
}

export function getAssignTarget(node: AstNode): AstNode | string | null {
  const variable =
    typeof node.variable === "string"
      ? node.variable
      : typeof node.variable === "object"
        ? (node.variable as AstNode)
        : null;
  return node.target ?? node.left ?? variable ?? null;
}

export function getAssignValue(node: AstNode): AstNode | null {
  return node.value ?? node.right ?? node.expression ?? null;
}

export function getRange(node: AstNode): SourceRange | undefined {
  const startLine =
    node.loc?.start?.line ??
    node.range?.startLine ??
    node.startLine ??
    node.pos?.line;
  const endLine =
    node.loc?.end?.line ??
    node.range?.endLine ??
    node.endLine ??
    node.pos?.line;

  if (typeof startLine === "number" && typeof endLine === "number") {
    return { startLine, endLine };
  }

  return undefined;
}
