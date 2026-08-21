import type { AstNode } from "@aa/types";

import type { PartialSyntaxContext } from "./resolvePartialSyntaxContext";

export interface AstContextResolution {
  readonly hasProcedure: boolean;
  readonly procedureName?: string;
  readonly hasStatements: boolean;
  readonly hasReturn: boolean;
  readonly hasIf: boolean;
  readonly hasFor: boolean;
  readonly hasWhile: boolean;
  readonly hasRepeat: boolean;
  readonly hasExpression: boolean;
  readonly nearestNodeType?: AstNode["type"];
  readonly parentNodeType?: AstNode["type"];
}

/**
 * The canonical AST currently exposes only `pos` (the node start), not an end
 * range. This resolver therefore uses AST positions for evidence and nearest
 * node reporting, while source token scanning remains authoritative for exact
 * cursor containment and incomplete syntax.
 */

function containsNode(
  node: AstNode | null | undefined,
  type: AstNode["type"],
): boolean {
  if (!node) return false;
  if (node.type === type) return true;
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      if (
        value.some(
          (child) =>
            child &&
            typeof child === "object" &&
            "type" in child &&
            containsNode(child as AstNode, type),
        )
      )
        return true;
    } else if (
      value &&
      typeof value === "object" &&
      "type" in value &&
      containsNode(value as AstNode, type)
    ) {
      return true;
    }
  }
  return false;
}

function positionToOffset(
  source: string,
  position: { line: number; column: number } | undefined,
): number | undefined {
  if (!position || position.line < 1) return undefined;
  const lines = source.split("\n");
  if (position.line > lines.length) return undefined;
  let offset = 0;
  for (let line = 1; line < position.line; line += 1) {
    offset += lines[line - 1]!.length + 1;
  }
  return offset + Math.max(0, position.column);
}

function collectAstEvidence(
  root: AstNode,
  source: string,
  cursorOffset: number,
): Pick<
  AstContextResolution,
  | "hasIf"
  | "hasFor"
  | "hasWhile"
  | "hasRepeat"
  | "hasExpression"
  | "nearestNodeType"
  | "parentNodeType"
> {
  let hasIf = false;
  let hasFor = false;
  let hasWhile = false;
  let hasRepeat = false;
  let hasExpression = false;
  let nearestNodeType: AstNode["type"] | undefined;
  let parentNodeType: AstNode["type"] | undefined;
  let nearestStart = -1;

  const visit = (node: AstNode, parent: AstNode | undefined) => {
    if (node.type === "If") hasIf = true;
    if (node.type === "For") hasFor = true;
    if (node.type === "While") hasWhile = true;
    if (node.type === "Repeat") hasRepeat = true;
    if (
      [
        "Binary",
        "Unary",
        "Index",
        "Field",
        "Literal",
        "Identifier",
        "Call",
      ].includes(node.type)
    ) {
      hasExpression = true;
    }

    const start = positionToOffset(source, node.pos);
    if (start !== undefined && start <= cursorOffset && start > nearestStart) {
      nearestStart = start;
      nearestNodeType = node.type;
      parentNodeType = parent?.type;
    }

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === "object" && "type" in child) {
            visit(child as AstNode, node);
          }
        }
      } else if (value && typeof value === "object" && "type" in value) {
        visit(value as AstNode, node);
      }
    }
  };

  visit(root, undefined);
  return {
    hasIf,
    hasFor,
    hasWhile,
    hasRepeat,
    hasExpression,
    nearestNodeType,
    parentNodeType,
  };
}

function findProcedure(
  ast: AstNode,
  partial: PartialSyntaxContext,
): Extract<AstNode, { type: "ProcDef" }> | undefined {
  if (ast.type === "ProcDef") return ast;
  if (ast.type !== "Program") return undefined;
  const procedures = ast.body.filter(
    (node): node is Extract<AstNode, { type: "ProcDef" }> =>
      node.type === "ProcDef",
  );
  return (
    procedures.find(
      (procedure) =>
        procedure.name.toLowerCase() === partial.procedureName?.toLowerCase(),
    ) ?? procedures[0]
  );
}

export function resolveAstContext(
  ast: AstNode | null | undefined,
  partial: PartialSyntaxContext,
  source = "",
  cursorOffset = 0,
): AstContextResolution {
  if (!ast) {
    return {
      hasProcedure: false,
      hasStatements: false,
      hasReturn: false,
      hasIf: false,
      hasFor: false,
      hasWhile: false,
      hasRepeat: false,
      hasExpression: false,
    };
  }

  const procedure = findProcedure(ast, partial);
  const procedureScope = procedure ?? ast;
  const hasProcedure =
    ast.type === "ProcDef" ||
    (ast.type === "Program" &&
      ast.body.some((node) => node.type === "ProcDef"));
  const hasStatements = procedure?.body.body.length
    ? true
    : ast.type === "Program" && ast.body.some((node) => node.type !== "ProcDef")
      ? true
      : false;

  return {
    hasProcedure,
    procedureName: procedure?.name,
    hasStatements,
    hasReturn: containsNode(procedureScope, "Return"),
    ...collectAstEvidence(procedureScope, source, cursorOffset),
  };
}
