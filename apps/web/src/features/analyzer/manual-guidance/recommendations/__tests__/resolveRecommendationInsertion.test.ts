import { resolveEditorContext } from "../../context/resolveEditorContext";
import { resolveRecommendationInsertion } from "../resolveRecommendationInsertion";
import type { GuidanceRecommendation } from "../types";

function recommendation(
  id: string,
  snippetId?: string,
): GuidanceRecommendation {
  return {
    id,
    snippetId,
    intent: "expression",
    action: "insert",
    priority: 1,
    reason: "inside-expression",
  };
}

function contextFor(source: string) {
  return resolveEditorContext({
    source,
    cursor: {
      line: source.split("\n").length,
      column: source.split("\n").at(-1)?.length ?? 0,
      offset: source.length,
    },
    parseResult: { status: "invalid", errors: [] },
  });
}

describe("resolveRecommendationInsertion", () => {
  it("resolves catalog snippets with localized insertion text", () => {
    const insertion = resolveRecommendationInsertion(
      recommendation("assign", "assign"),
      contextFor("suma(n) BEGIN\n  "),
      "en",
    );

    expect(insertion).toMatchObject({
      recommendationId: "assign",
      snippetId: "assign",
      snippetText: "${1:variable} <- ${2:n};",
    });
  });

  it("uses the identifier already typed for an algorithm header", () => {
    const source = "hola";
    const context = resolveEditorContext({
      source,
      cursor: { line: 1, column: source.length, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });

    const insertion = resolveRecommendationInsertion(
      {
        id: "algorithm-header",
        snippetId: "algorithm-header",
        intent: "start",
        action: "insert",
        priority: 1000,
        reason: "inside-body",
      },
      context,
      "es",
      source,
    );

    expect(insertion).toMatchObject({
      snippetText: "${1:hola}(${2:parametros}) BEGIN\n  ${3}\nEND",
      replaceStartOffset: 0,
      replaceEndOffset: 4,
    });
  });

  it("continues an existing operand when suggesting a comparison", () => {
    const insertion = resolveRecommendationInsertion(
      recommendation("comparison"),
      contextFor("IF (n "),
      "es",
      "IF (n ",
    );

    expect(insertion?.snippetText).toBe(" <= ${1:limite}");
  });

  it("suggests a complete comparison when no operand exists", () => {
    const insertion = resolveRecommendationInsertion(
      recommendation("comparison"),
      contextFor("IF ("),
      "es",
      "IF (",
    );

    expect(insertion?.snippetText).toBe("${1:n} <= ${2:limite}");
  });

  it.each([
    ["and", "AND "],
    ["or", "OR "],
    ["not", "NOT (${1:condition})"],
  ])("resolves the %s logical insertion", (id, expected) => {
    const insertion = resolveRecommendationInsertion(
      recommendation(id),
      contextFor("IF (n "),
      "es",
      "IF (n ",
    );

    expect(insertion?.snippetText).toBe(expected);
  });

  it("uses an available symbol for symbol recommendations", () => {
    const insertion = resolveRecommendationInsertion(
      recommendation("symbols"),
      contextFor("suma(n) BEGIN\n  IF (n "),
      "es",
      "  IF (n ",
    );

    expect(insertion?.snippetText).toBe("${1:n}");
  });

  it("provides an editable parameter placeholder", () => {
    expect(
      resolveRecommendationInsertion(
        recommendation("scalar-parameter"),
        contextFor("suma("),
        "es",
        "suma(",
      )?.snippetText,
    ).toBe("n");
    expect(
      resolveRecommendationInsertion(
        recommendation("array-parameter"),
        contextFor("suma("),
        "es",
        "suma(",
      )?.snippetText,
    ).toBe("A[n]");
    expect(
      resolveRecommendationInsertion(
        recommendation("range-parameter"),
        contextFor("suma("),
        "es",
        "suma(",
      )?.snippetText,
    ).toBe("A[n]..[m]");
    expect(
      resolveRecommendationInsertion(
        recommendation("object-parameter"),
        contextFor("suma("),
        "es",
        "suma(",
      )?.snippetText,
    ).toBe("Clase objeto");
  });

  it("does not resolve an analysis recommendation as inline text", () => {
    const insertion = resolveRecommendationInsertion(
      {
        ...recommendation("analyze"),
        action: "analyze",
        intent: "analysis",
      },
      contextFor("suma(n) BEGIN\nEND"),
      "es",
    );

    expect(insertion).toBeNull();
  });
});
