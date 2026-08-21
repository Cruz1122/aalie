import type { AstNode } from "@aa/types";

export type EditorLocation =
  | "EMPTY_DOCUMENT"
  | "TOP_LEVEL"
  | "PROCEDURE_SIGNATURE"
  | "PARAMETER_LIST"
  | "PROCEDURE_BODY"
  | "CONDITION"
  | "EXPRESSION"
  | "IF_BODY"
  | "LOOP_BODY"
  | "RETURN_EXPRESSION"
  | "SELECTION"
  | "UNKNOWN";

export interface EditorParseError {
  readonly line: number;
  readonly column: number;
  readonly message: string;
}

export interface EditorSymbol {
  readonly name: string;
  readonly kind: "parameter" | "variable";
}

export interface EditorCursor {
  /** One-based line number, matching Monaco and parser errors. */
  readonly line: number;
  /** Zero-based column, matching AST positions and parser errors. */
  readonly column: number;
  /** Zero-based UTF-16 source offset. */
  readonly offset: number;
}

export interface EditorSelection {
  readonly active: boolean;
  readonly text: string;
  readonly startOffset: number;
  readonly endOffset: number;
}

export interface EditorParseStateInput {
  readonly status: "idle" | "pending" | "valid" | "invalid";
  readonly errors?: readonly EditorParseError[];
}

export interface ResolveEditorContextInput {
  readonly source: string;
  readonly cursor: EditorCursor;
  readonly selection?: Partial<EditorSelection> | null;
  readonly parseResult?: EditorParseStateInput | null;
  readonly ast?: AstNode | null;
}

export interface EditorContext {
  readonly document: {
    readonly isEmpty: boolean;
    readonly source: string;
  };
  readonly cursor: EditorCursor;
  readonly selection: EditorSelection;
  readonly parse: {
    readonly status: "idle" | "pending" | "valid" | "invalid";
    readonly errors: readonly EditorParseError[];
    readonly hasUsableAst: boolean;
  };
  readonly location: {
    readonly primary: EditorLocation;
    readonly insideProcedure: boolean;
    readonly insideParameters: boolean;
    readonly insideBlock: boolean;
    readonly insideCondition: boolean;
    readonly insideExpression: boolean;
    readonly insideLoop: boolean;
    readonly insideConditional: boolean;
  };
  readonly structure: {
    readonly hasProcedure: boolean;
    readonly procedureName?: string;
    readonly hasStatements: boolean;
    readonly hasReturn: boolean;
  };
  readonly symbols: {
    readonly parameters: readonly EditorSymbol[];
    readonly variables: readonly EditorSymbol[];
  };
  readonly capabilities: {
    readonly canInsertStatement: boolean;
    readonly canInsertExpression: boolean;
    readonly canInsertParameter: boolean;
    readonly canWrapSelection: boolean;
    readonly canReturn: boolean;
    readonly canAnalyze: boolean;
  };
}
