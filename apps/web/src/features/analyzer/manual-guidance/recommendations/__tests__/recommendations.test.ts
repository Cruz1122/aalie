import { resolveEditorContext } from "../../context/resolveEditorContext";
import { getContextualRecommendations } from "../index";
import { rankRecommendations } from "../rankRecommendations";
import type { RecommendationRule } from "../types";

function contextFor(
  source: string,
  parseStatus: "idle" | "pending" | "valid" | "invalid" = "invalid",
) {
  return resolveEditorContext({
    source,
    cursor: {
      line: source.split("\n").length,
      column: source.split("\n").at(-1)?.length ?? 0,
      offset: source.length,
    },
    parseResult: { status: parseStatus, errors: [] },
  });
}

describe("contextual recommendations", () => {
  it("ranks empty-document recommendations exactly", () => {
    expect(
      getContextualRecommendations(contextFor(""), { limit: 4 }).map(
        (item) => item.id,
      ),
    ).toEqual(["algorithm-header", "comment"]);
  });

  it("returns condition recommendations in deterministic order", () => {
    const recommendations = getContextualRecommendations(contextFor("IF (n "), {
      limit: 4,
    });
    expect(recommendations.map((item) => item.id)).toEqual([
      "comparison",
      "and",
      "or",
      "symbols",
    ]);
  });

  it("returns body snippets and applies the configured limit", () => {
    const recommendations = getContextualRecommendations(
      contextFor("suma(n) BEGIN\n  "),
      { limit: 4 },
    );
    expect(recommendations.map((item) => item.id)).toEqual([
      "assign",
      "if",
      "for",
      "while",
    ]);
  });

  it("keeps analysis alongside local recommendations for valid programs", () => {
    const source = "suma(n) BEGIN\n  x <- n;\nEND";
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 6, offset: source.indexOf("x <-") },
      ast: {
        type: "Program",
        pos: { line: 1, column: 0 },
        body: [],
      },
      parseResult: { status: "valid", errors: [] },
    });

    const recommendations = getContextualRecommendations(context, {
      limit: 10,
    });
    expect(recommendations[0]?.id).toBe("analyze");
    expect(recommendations.map((item) => item.id)).toEqual([
      ...new Set(recommendations.map((item) => item.id)),
    ]);
  });

  it("returns selection wrappers", () => {
    const source = "suma(n) BEGIN\n  x <- 0;\nEND";
    const startOffset = source.indexOf("x <-");
    const endOffset = source.indexOf(";", startOffset) + 1;
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 0, offset: startOffset },
      selection: {
        active: true,
        text: source.slice(startOffset, endOffset),
        startOffset,
        endOffset,
      },
      parseResult: { status: "invalid", errors: [] },
    });

    expect(
      getContextualRecommendations(context).map((item) => item.id),
    ).toEqual(["if", "for", "while", "begin-end"]);
  });

  it("is deterministic for repeated identical inputs", () => {
    const context = contextFor("WHILE (i < ");
    expect(getContextualRecommendations(context)).toEqual(
      getContextualRecommendations(context),
    );
  });

  it("deduplicates by id, preserves priority and filters unavailable snippets", () => {
    const rules: RecommendationRule[] = [
      {
        id: "test",
        order: 0,
        matches: () => true,
        recommendations: [
          {
            id: "missing",
            snippetId: "does-not-exist",
            intent: "statement",
            action: "insert",
            priority: 100,
            reason: "inside-body",
          },
          {
            id: "same",
            intent: "statement",
            action: "insert",
            priority: 10,
            reason: "inside-body",
          },
          {
            id: "same",
            intent: "statement",
            action: "insert",
            priority: 20,
            reason: "inside-body",
          },
        ],
      },
    ];

    expect(rankRecommendations(contextFor("x"), { limit: 10, rules })).toEqual([
      {
        id: "same",
        intent: "statement",
        action: "insert",
        priority: 20,
        reason: "inside-body",
      },
    ]);
  });
});
