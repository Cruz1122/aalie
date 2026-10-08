import type { AstNode } from "@aa/types";

import type { EditorSymbol } from "./types";

interface SymbolAccumulator {
  readonly parameters: EditorSymbol[];
  readonly variables: EditorSymbol[];
  readonly parameterKeys: Set<string>;
  readonly variableKeys: Set<string>;
}

function createAccumulator(): SymbolAccumulator {
  return {
    parameters: [],
    variables: [],
    parameterKeys: new Set<string>(),
    variableKeys: new Set<string>(),
  };
}

function addSymbol(
  accumulator: SymbolAccumulator,
  name: string | undefined,
  kind: EditorSymbol["kind"],
): void {
  const normalized = name?.trim();
  if (!normalized || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(normalized)) return;

  const key = normalized.toLowerCase();
  const seen =
    kind === "parameter" ? accumulator.parameterKeys : accumulator.variableKeys;
  if (seen.has(key)) return;
  seen.add(key);
  accumulator[kind === "parameter" ? "parameters" : "variables"].push({
    name: normalized,
    kind,
  });
}

function rootIdentifier(node: AstNode | undefined): string | undefined {
  if (!node) return undefined;
  if (node.type === "Identifier") return node.name;
  if (node.type === "Index" || node.type === "Field")
    return rootIdentifier(node.target);
  return undefined;
}

function walkAst(
  node: AstNode | null | undefined,
  visit: (node: AstNode) => void,
): void {
  if (!node) return;
  visit(node);

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === "object" && "type" in child) {
          walkAst(child as AstNode, visit);
        }
      }
    } else if (value && typeof value === "object" && "type" in value) {
      walkAst(value as AstNode, visit);
    }
  }
}

function extractFromAst(
  ast: AstNode | null | undefined,
  procedureName?: string,
): {
  parameters: EditorSymbol[];
  variables: EditorSymbol[];
} {
  const accumulator = createAccumulator();
  let activeProcedure: AstNode | undefined;

  if (ast?.type === "Program") {
    const procedures = ast.body.filter(
      (node): node is Extract<AstNode, { type: "ProcDef" }> =>
        node.type === "ProcDef",
    );
    activeProcedure =
      procedures.find((procedure) => procedure.name === procedureName) ??
      procedures[0];
  } else if (ast?.type === "ProcDef") {
    activeProcedure = ast;
  }

  if (activeProcedure?.type === "ProcDef") {
    for (const parameter of activeProcedure.params) {
      addSymbol(accumulator, parameter.name, "parameter");
    }
    walkAst(activeProcedure.body, (node) => {
      if (node.type === "Assign")
        addSymbol(accumulator, rootIdentifier(node.target), "variable");
      if (node.type === "For") addSymbol(accumulator, node.var, "variable");
      if (node.type === "DeclVector")
        addSymbol(accumulator, node.id, "variable");
    });
  } else {
    walkAst(ast, (node) => {
      if (node.type === "Assign")
        addSymbol(accumulator, rootIdentifier(node.target), "variable");
      if (node.type === "For") addSymbol(accumulator, node.var, "variable");
      if (node.type === "DeclVector")
        addSymbol(accumulator, node.id, "variable");
    });
  }

  return {
    parameters: accumulator.parameters,
    variables: accumulator.variables,
  };
}

function splitParameters(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  let bracketDepth = 0;

  for (const character of value) {
    if (character === "[") bracketDepth += 1;
    if (character === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    if (character === "," && bracketDepth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  parts.push(current);
  return parts;
}

function parameterName(raw: string): string | undefined {
  const withoutDimensions = raw
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\.\./g, " ");
  const identifiers = withoutDimensions.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
  if (identifiers.length === 0) return undefined;
  return identifiers.length > 1
    ? identifiers[identifiers.length - 1]
    : identifiers[0];
}

export function extractTextualSymbols(
  source: string,
  cursorOffset: number,
  procedureName?: string,
): {
  parameters: EditorSymbol[];
  variables: EditorSymbol[];
} {
  const accumulator = createAccumulator();
  const sourceBeforeCursor = source.slice(0, cursorOffset);
  const signatureRegex =
    /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(([^()]*)\)\s*(?:BEGIN\b|\{)/gim;
  let selectedSignature: RegExpExecArray | null = null;
  const collectAllSignatures = !procedureName;

  for (const match of source.matchAll(signatureRegex)) {
    const name = match[1];
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (procedureName && name?.toLowerCase() === procedureName.toLowerCase()) {
      selectedSignature = match;
      break;
    }
    if (!collectAllSignatures) {
      if (cursorOffset >= start && cursorOffset <= end)
        selectedSignature = match;
      if (!selectedSignature && start <= cursorOffset)
        selectedSignature = match;
    } else {
      for (const rawParameter of splitParameters(match[2] ?? "")) {
        addSymbol(accumulator, parameterName(rawParameter), "parameter");
      }
    }
  }

  if (selectedSignature?.[2] !== undefined) {
    for (const rawParameter of splitParameters(selectedSignature[2])) {
      addSymbol(accumulator, parameterName(rawParameter), "parameter");
    }
  }

  const assignmentRegex =
    /^\s*(?:FOR\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[[^\n]*\])?\s*<-/gim;
  for (const match of sourceBeforeCursor.matchAll(assignmentRegex)) {
    addSymbol(accumulator, match[1], "variable");
  }

  return {
    parameters: accumulator.parameters,
    variables: accumulator.variables,
  };
}

export function extractSymbols(
  source: string,
  cursorOffset: number,
  ast?: AstNode | null,
  procedureName?: string,
): { parameters: EditorSymbol[]; variables: EditorSymbol[] } {
  const fromAst = extractFromAst(ast, procedureName);
  const fromText = extractTextualSymbols(source, cursorOffset, procedureName);

  const merge = (
    first: EditorSymbol[],
    second: EditorSymbol[],
  ): EditorSymbol[] => {
    const seen = new Set<string>();
    const result: EditorSymbol[] = [];
    for (const symbol of [...first, ...second]) {
      const key = symbol.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(symbol);
    }
    return result;
  };

  return {
    parameters: merge(fromAst.parameters, fromText.parameters),
    variables: merge(fromAst.variables, fromText.variables),
  };
}
