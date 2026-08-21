import type { AstNode } from "@aa/types";

import { extractSymbols } from "./extractSymbols";
import { resolveAstContext } from "./resolveAstContext";
import { resolveCapabilities } from "./resolveCapabilities";
import { resolvePartialSyntaxContext } from "./resolvePartialSyntaxContext";
import type {
  EditorContext,
  EditorParseError,
  EditorSelection,
  ResolveEditorContextInput,
} from "./types";

function normalizeCursor(
  input: ResolveEditorContextInput["cursor"],
  source: string,
): EditorContext["cursor"] {
  const offset = Math.max(0, Math.min(input.offset, source.length));
  const line = Math.max(1, Math.floor(input.line || 1));
  const column = Math.max(0, Math.floor(input.column || 0));
  return { line, column, offset };
}

function normalizeSelection(
  selection: ResolveEditorContextInput["selection"],
  source: string,
): EditorSelection {
  const startOffset = Math.max(
    0,
    Math.min(selection?.startOffset ?? 0, source.length),
  );
  const endOffset = Math.max(
    startOffset,
    Math.min(selection?.endOffset ?? startOffset, source.length),
  );
  const text = selection?.text ?? source.slice(startOffset, endOffset);
  return {
    active: Boolean(selection?.active ?? endOffset > startOffset),
    text,
    startOffset,
    endOffset,
  };
}

function resolveParseState(
  source: string,
  parseResult: ResolveEditorContextInput["parseResult"],
  ast: AstNode | null | undefined,
): EditorContext["parse"] {
  const errors: readonly EditorParseError[] = parseResult?.errors
    ? [...parseResult.errors]
    : [];
  const status =
    source.trim().length === 0
      ? "idle"
      : (parseResult?.status ?? (ast ? "valid" : "idle"));
  return {
    status,
    errors,
    hasUsableAst: Boolean(ast && status === "valid"),
  };
}

export function resolveEditorContext(
  input: ResolveEditorContextInput,
): EditorContext {
  const source = input.source ?? "";
  const cursor = normalizeCursor(input.cursor, source);
  const selection = normalizeSelection(input.selection, source);
  const parse = resolveParseState(source, input.parseResult, input.ast);

  if (source.trim().length === 0) {
    const location: EditorContext["location"] = {
      primary: "EMPTY_DOCUMENT",
      insideProcedure: false,
      insideParameters: false,
      insideBlock: false,
      insideCondition: false,
      insideExpression: false,
      insideLoop: false,
      insideConditional: false,
    };
    const contextWithoutCapabilities = {
      document: { isEmpty: true, source },
      cursor,
      selection,
      parse,
      location,
      structure: {
        hasProcedure: false,
        hasStatements: false,
        hasReturn: false,
      },
      symbols: { parameters: [], variables: [] },
    } as const;
    return {
      ...contextWithoutCapabilities,
      capabilities: resolveCapabilities(location, parse, selection),
    };
  }

  const partial = resolvePartialSyntaxContext(source, cursor.offset);
  const astContext = resolveAstContext(
    input.ast,
    partial,
    source,
    cursor.offset,
  );
  const symbols = extractSymbols(
    source,
    cursor.offset,
    input.ast,
    astContext.procedureName ?? partial.procedureName,
  );
  const selectionInsideCode =
    selection.active && selection.text.trim().length > 0;
  const primary =
    selectionInsideCode && (partial.insideBlock || partial.insideProcedure)
      ? "SELECTION"
      : partial.primary;
  const location: EditorContext["location"] = {
    primary,
    insideProcedure:
      partial.insideProcedure || Boolean(astContext.procedureName),
    insideParameters: partial.insideParameters,
    insideBlock: partial.insideBlock,
    insideCondition: partial.insideCondition,
    insideExpression: partial.insideExpression,
    insideLoop: partial.insideLoop,
    insideConditional: partial.insideConditional,
  };
  const structure = {
    hasProcedure: astContext.hasProcedure || Boolean(partial.procedureName),
    procedureName: astContext.procedureName ?? partial.procedureName,
    hasStatements: astContext.hasStatements,
    hasReturn: astContext.hasReturn,
  };

  return {
    document: { isEmpty: false, source },
    cursor,
    selection,
    parse,
    location,
    structure,
    symbols,
    capabilities: resolveCapabilities(location, parse, selection),
  };
}
