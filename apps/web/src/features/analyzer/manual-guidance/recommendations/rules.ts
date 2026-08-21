import { getSnippetById } from "@/features/analyzer/editor-support/catalog/snippetCatalog";

import type { RecommendationRule } from "./types";

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
        "parameter-symbols",
        "parameter",
        "insert",
        1000,
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
    matches: (context) => context.location.primary === "TOP_LEVEL",
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
    matches: (context) => context.capabilities.canAnalyze,
    recommendations: [
      candidate("analyze", "analysis", "analyze", 1200, "valid-program"),
    ],
  },
];
