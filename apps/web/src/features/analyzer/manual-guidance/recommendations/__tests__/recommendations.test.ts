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

  it("prefers a return when the cursor is at the end of a body that has no output", () => {
    const source = "suma(n) BEGIN\n  x <- n;\nEND";
    const context = resolveEditorContext({
      source,
      cursor: {
        line: 3,
        column: 0,
        offset: source.lastIndexOf("END"),
      },
      parseResult: { status: "invalid", errors: [] },
    });

    expect(getContextualRecommendations(context)[0]?.id).toBe("return-value");
  });

  it("ranks another loop below a decision once a loop already exists", () => {
    const source = "suma(n) BEGIN\n  FOR i <- 1 TO n DO BEGIN\n  END\n  ";
    expect(
      getContextualRecommendations(contextFor(source), { limit: 4 }).map(
        (item) => item.id,
      ),
    ).toEqual(["assign", "if", "call", "return-value"]);
  });

  it("does not lead with the construct that was just written", () => {
    const afterAssignment = "suma(n) BEGIN\n  x <- n;\n  ";
    const afterLoop = "suma(n) BEGIN\n  FOR i <- 1 TO n DO BEGIN\n  ";

    expect(
      getContextualRecommendations(contextFor(afterAssignment), {
        limit: 4,
      }).map((item) => item.id)[0],
    ).not.toBe("assign");
    expect(
      getContextualRecommendations(contextFor(afterLoop), { limit: 4 }).map(
        (item) => item.id,
      )[0],
    ).not.toBe("for");
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

  it("keeps writing recommendations while the cursor is inside a valid body", () => {
    const source = "suma(n) BEGIN\n  x <- n;\n  RETURN x;\nEND";
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
    expect(recommendations.map((item) => item.id)).not.toContain("analyze");
    expect(recommendations[0]?.id).toBe("assign");
    expect(recommendations.map((item) => item.id)).toEqual([
      ...new Set(recommendations.map((item) => item.id)),
    ]);
  });

  it("offers analysis only after a closed algorithm has statements and output", () => {
    const source = "suma(n) BEGIN\n  x <- n;\n  RETURN x;\nEND";
    const onEnd = resolveEditorContext({
      source,
      cursor: {
        line: 4,
        column: 0,
        offset: source.lastIndexOf("END"),
      },
      ast: {
        type: "Program",
        pos: { line: 1, column: 0 },
        body: [],
      },
      parseResult: { status: "valid", errors: [] },
    });
    const afterProgram = resolveEditorContext({
      source: `${source}\n`,
      cursor: {
        line: 5,
        column: 0,
        offset: source.length + 1,
      },
      ast: {
        type: "Program",
        pos: { line: 1, column: 0 },
        body: [],
      },
      parseResult: { status: "valid", errors: [] },
    });
    const emptyProgram = "suma(n) BEGIN\nEND";
    const empty = resolveEditorContext({
      source: emptyProgram,
      cursor: {
        line: 2,
        column: 0,
        offset: emptyProgram.lastIndexOf("END"),
      },
      ast: {
        type: "Program",
        pos: { line: 1, column: 0 },
        body: [],
      },
      parseResult: { status: "valid", errors: [] },
    });

    expect(getContextualRecommendations(onEnd)[0]?.id).toBe("analyze");
    expect(getContextualRecommendations(afterProgram)[0]?.id).toBe("analyze");
    expect(
      getContextualRecommendations(empty).map((item) => item.id),
    ).not.toContain("analyze");
  });

  it("does not offer a new header while the cursor rests on END", () => {
    const source = "suma(n) BEGIN\nEND";
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 3, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });

    expect(
      getContextualRecommendations(context, { limit: 10 }).map(
        (item) => item.id,
      ),
    ).not.toContain("algorithm-header");
  });

  it("offers parameter shapes inside a signature", () => {
    expect(
      getContextualRecommendations(contextFor("suma(")).map((item) => item.id),
    ).toEqual([
      "scalar-parameter",
      "array-parameter",
      "range-parameter",
      "object-parameter",
    ]);
  });

  it("keeps the next statement available after a finished assignment", () => {
    expect(
      getContextualRecommendations(contextFor("suma(n) BEGIN\n  x <- n"))[0]
        ?.id,
    ).toBe("assign");
  });

  it("stays quiet while an inserted placeholder is still selected", () => {
    const source = "suma(n) BEGIN\n  variable <- valor;\nEND";
    const startOffset = source.indexOf("variable");
    const context = resolveEditorContext({
      source,
      cursor: {
        line: 2,
        column: 2 + "variable".length,
        offset: startOffset + "variable".length,
      },
      selection: {
        active: true,
        text: "variable",
        startOffset,
        endOffset: startOffset + "variable".length,
        origin: "placeholder",
      },
      parseResult: { status: "invalid", errors: [] },
    });

    expect(context.location.primary).not.toBe("SELECTION");
    expect(getContextualRecommendations(context)).toEqual([]);
  });

  it("shows parameter shapes while the inserted parameter list is selected", () => {
    const source = "suma(parametros) BEGIN\nEND";
    const startOffset = source.indexOf("parametros");
    const context = resolveEditorContext({
      source,
      cursor: {
        line: 1,
        column: startOffset + "parametros".length,
        offset: startOffset + "parametros".length,
      },
      selection: {
        active: true,
        text: "parametros",
        startOffset,
        endOffset: startOffset + "parametros".length,
        origin: "parameters",
      },
      parseResult: { status: "invalid", errors: [] },
    });

    expect(
      getContextualRecommendations(context).map((item) => item.id),
    ).toEqual([
      "scalar-parameter",
      "array-parameter",
      "range-parameter",
      "object-parameter",
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
