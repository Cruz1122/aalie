import { getSnippetById } from "@/features/analyzer/editor-support/catalog/snippetCatalog";

import type { RecommendationRule } from "./types";
import type { EditorContext, EditorLocation } from "../context/types";

const ACTIVE_WRITING_LOCATIONS = new Set<EditorLocation>([
  "PARAMETER_LIST",
  "CONDITION",
  "EXPRESSION",
  "RETURN_EXPRESSION",
  "PROCEDURE_BODY",
  "IF_BODY",
  "LOOP_BODY",
]);

function isOnClosingEndLine(context: EditorContext): boolean {
  const line =
    context.document.source.split("\n")[context.cursor.line - 1] ?? "";
  return /^\s*END\b/i.test(line);
}

function isAtProcedureBodyTail(context: EditorContext): boolean {
  if (context.location.primary !== "PROCEDURE_BODY") return false;
  if (isOnClosingEndLine(context)) return true;

  const lines = context.document.source.split("\n");
  const lineIndex = context.cursor.line - 1;
  const current = lines[lineIndex] ?? "";
  const next = lines[lineIndex + 1] ?? "";
  return /^\s*$/u.test(current) && /^\s*END\b/i.test(next);
}

export function adjustRecommendationPriority(
  recommendation: { readonly id: string; readonly priority: number },
  context: EditorContext,
): number {
  let priority = recommendation.priority;

  if (!context.structure.hasStatements && recommendation.id === "assign") {
    priority += 40;
  }

  if (
    recommendation.id === "return-value" &&
    context.structure.hasStatements &&
    !context.structure.hasOutput &&
    isAtProcedureBodyTail(context)
  ) {
    priority += 120;
  }

  if (
    context.location.primary === "LOOP_BODY" &&
    recommendation.id === "assign"
  ) {
    priority += 30;
  }

  if (
    context.structure.hasLoop &&
    (recommendation.id === "for" ||
      recommendation.id === "while" ||
      recommendation.id === "repeat-until")
  ) {
    priority -= 40;
  }

  if (recommendation.id === recentConstruct(context)) {
    priority -= 80;
  }

  return priority;
}

function recentConstruct(context: EditorContext): string | null {
  const lines = context.document.source.split("\n");
  const index = Math.max(0, context.cursor.line - 1);
  const current = lines[index] ?? "";
  const currentKind = completedConstruct(current);
  const start =
    currentKind && context.cursor.column >= current.trimEnd().length
      ? index
      : index - 1;

  for (let line = start; line >= 0; line -= 1) {
    const kind = completedConstruct(lines[line] ?? "");
    if (kind) return kind;
    const trimmed = (lines[line] ?? "").trim();
    if (trimmed && !/^END\b/i.test(trimmed)) return null;
  }
  return null;
}

function completedConstruct(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || /^END\b/i.test(trimmed)) return null;
  if (/^FOR\b/i.test(trimmed)) return "for";
  if (/^WHILE\b/i.test(trimmed)) return "while";
  if (/^REPEAT\b/i.test(trimmed)) return "repeat-until";
  if (/^IF\b/i.test(trimmed)) return "if";
  if (/^CALL\b/i.test(trimmed)) return "call";
  if (/^RETURN\b|^PRINT\b/i.test(trimmed)) return "return-value";
  if (/(?:<-|:=)/.test(trimmed) && /;\s*$/u.test(trimmed)) return "assign";
  return null;
}

function isReadyToAnalyze(context: EditorContext): boolean {
  if (!context.capabilities.canAnalyze) return false;
  if (!context.structure.hasStatements || !context.structure.hasOutput)
    return false;
  if (
    context.location.primary === "PROCEDURE_SIGNATURE" ||
    context.location.primary === "SELECTION" ||
    context.location.primary === "UNKNOWN" ||
    context.location.primary === "EMPTY_DOCUMENT"
  ) {
    return false;
  }

  return (
    !ACTIVE_WRITING_LOCATIONS.has(context.location.primary) ||
    isOnClosingEndLine(context)
  );
}

function candidate(
  id: string,
  intent: RecommendationRule["recommendations"][number]["intent"],
  action: RecommendationRule["recommendations"][number]["action"],
  priority: number,
  reason: RecommendationRule["recommendations"][number]["reason"],
  snippetId?: string,
) {
  return { id, snippetId, intent, action, priority, reason };
}

function withExistingSnippet<T extends { snippetId?: string }>(
  recommendation: T,
): T {
  if (!recommendation.snippetId || getSnippetById(recommendation.snippetId))
    return recommendation;
  return { ...recommendation, snippetId: undefined };
}

const bodyRecommendations = [
  candidate("assign", "statement", "insert", 1000, "inside-body", "assign"),
  candidate("if", "decision", "insert", 990, "inside-body", "if"),
  candidate("for", "loop", "insert", 980, "inside-body", "for"),
  candidate("while", "loop", "insert", 970, "inside-body", "while"),
  candidate(
    "repeat-until",
    "loop",
    "insert",
    965,
    "inside-body",
    "repeat-until",
  ),
  candidate("call", "statement", "insert", 960, "inside-body", "call"),
  candidate(
    "return-value",
    "output",
    "insert",
    950,
    "inside-body",
    "return-value",
  ),
].map(withExistingSnippet);

export const recommendationRules: readonly RecommendationRule[] = [
  {
    id: "empty-document",
    order: 0,
    matches: (context) => context.document.isEmpty,
    recommendations: [
      candidate(
        "algorithm-header",
        "start",
        "insert",
        1000,
        "empty-document",
        "algorithm-header",
      ),
      candidate("comment", "start", "insert", 900, "empty-document", "comment"),
    ].map(withExistingSnippet),
  },
  {
    id: "selection",
    order: 1,
    matches: (context) =>
      context.location.primary === "SELECTION" &&
      context.capabilities.canWrapSelection,
    recommendations: [
      candidate("if", "decision", "wrap", 1000, "selection", "if"),
      candidate("for", "loop", "wrap", 990, "selection", "for"),
      candidate("while", "loop", "wrap", 980, "selection", "while"),
      candidate("begin-end", "wrap", "wrap", 970, "selection", "begin-end"),
    ].map(withExistingSnippet),
  },
  {
    id: "parameter-list",
    order: 2,
    matches: (context) => context.location.primary === "PARAMETER_LIST",
    recommendations: [
      candidate(
        "scalar-parameter",
        "parameter",
        "insert",
        1000,
        "inside-expression",
      ),
      candidate(
        "array-parameter",
        "parameter",
        "insert",
        990,
        "inside-expression",
      ),
      candidate(
        "range-parameter",
        "parameter",
        "insert",
        980,
        "inside-expression",
      ),
      candidate(
        "object-parameter",
        "parameter",
        "insert",
        970,
        "inside-expression",
      ),
    ],
  },
  {
    id: "condition",
    order: 3,
    matches: (context) => context.location.primary === "CONDITION",
    recommendations: [
      candidate("comparison", "expression", "insert", 1000, "inside-condition"),
      candidate("and", "expression", "insert", 990, "inside-condition"),
      candidate("or", "expression", "insert", 980, "inside-condition"),
      candidate("symbols", "expression", "insert", 970, "inside-condition"),
      candidate("not", "expression", "insert", 960, "inside-condition"),
    ],
  },
  {
    id: "return-expression",
    order: 4,
    matches: (context) => context.location.primary === "RETURN_EXPRESSION",
    recommendations: [
      candidate("symbols", "expression", "insert", 1000, "inside-expression"),
      candidate(
        "call",
        "expression",
        "insert",
        990,
        "inside-expression",
        "call",
      ),
    ].map(withExistingSnippet),
  },
  {
    id: "expression",
    order: 5,
    matches: (context) => context.location.primary === "EXPRESSION",
    recommendations: [
      candidate("symbols", "expression", "insert", 1000, "inside-expression"),
      candidate(
        "call",
        "expression",
        "insert",
        990,
        "inside-expression",
        "call",
      ),
      candidate(
        "array-index",
        "expression",
        "insert",
        980,
        "inside-expression",
        "array-index",
      ),
    ].map(withExistingSnippet),
  },
  {
    id: "body",
    order: 6,
    matches: (context) =>
      ["PROCEDURE_BODY", "IF_BODY", "LOOP_BODY"].includes(
        context.location.primary,
      ),
    recommendations: bodyRecommendations,
  },
  {
    id: "top-level",
    order: 7,
    matches: (context) =>
      context.location.primary === "TOP_LEVEL" && !isOnClosingEndLine(context),
    recommendations: [
      candidate(
        "algorithm-header",
        "start",
        "insert",
        1000,
        "inside-body",
        "algorithm-header",
      ),
    ].map(withExistingSnippet),
  },
  {
    id: "valid-program",
    order: 8,
    matches: isReadyToAnalyze,
    recommendations: [
      candidate("analyze", "analysis", "analyze", 1200, "valid-program"),
    ],
  },
];
