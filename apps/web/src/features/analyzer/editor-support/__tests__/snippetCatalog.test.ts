import { resolveSnippetAlias } from "../catalog/snippetAliases";
import {
  completionSnippetCatalog,
  getCategorizedSnippets,
  localizeSnippet,
  recommendedSnippetIds,
  snippetCatalog,
} from "../catalog/snippetCatalog";

describe("snippet catalog", () => {
  it("keeps unique snippet ids", () => {
    const ids = snippetCatalog.map((snippet) => snippet.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps recommended list bounded and concrete", () => {
    expect(recommendedSnippetIds.length).toBeLessThanOrEqual(12);
    expect(recommendedSnippetIds).toContain("assign");
    expect(recommendedSnippetIds).toContain("algorithm-header");
  });

  it("resolves aliases through the shared map", () => {
    expect(resolveSnippetAlias("if")?.id).toBe("if");
    expect(resolveSnippetAlias("quick", "en")?.id).toBe("template-quicksort");
    expect(resolveSnippetAlias("memo", "en")?.id).toBe(
      "template-memoization-simple",
    );
    expect(resolveSnippetAlias("bubble", "en")?.id).toBe("catalog-bubble-sort");
    expect(resolveSnippetAlias("burbuja", "es")?.id).toBe(
      "catalog-bubble-sort",
    );
  });

  it("returns ordered sections without empty visible categories", () => {
    const sections = getCategorizedSnippets();
    expect(sections[0]?.category).toBe("recommended");
    expect(sections.every((section) => section.snippets.length > 0)).toBe(true);
  });

  it("keeps the support panel curated by section intent", () => {
    const sections = getCategorizedSnippets();
    const recommendedSection = sections.find(
      (section) => section.category === "recommended",
    );
    const loopsSection = sections.find(
      (section) => section.category === "loops",
    );
    const functionsSection = sections.find(
      (section) => section.category === "functions",
    );
    const templatesSection = sections.find(
      (section) => section.category === "templates",
    );

    expect(recommendedSection?.snippets).toHaveLength(12);
    expect(loopsSection?.snippets.map((snippet) => snippet.id)).toEqual([
      "for",
      "while",
      "repeat-until",
      "begin-end",
      "template-linear-traversal",
      "template-array-sum",
      "template-dp-table",
    ]);
    expect(functionsSection?.snippets.map((snippet) => snippet.id)).toEqual([
      "algorithm-header",
      "call",
      "return-value",
      "recursive-call",
      "rec-linear",
      "base-case",
      "length",
      "template-factorial",
      "template-fibonacci",
      "template-memoization-simple",
    ]);
    expect(templatesSection?.snippets).toHaveLength(109);
    expect(
      templatesSection?.snippets.slice(0, 9).map((snippet) => snippet.id),
    ).toEqual([
      "template-binary-search",
      "template-factorial",
      "template-fibonacci",
      "template-merge-sort",
      "template-quicksort",
      "template-linear-traversal",
      "template-array-sum",
      "template-memoization-simple",
      "template-dp-table",
    ]);
    expect(
      templatesSection?.snippets.some((snippet) =>
        snippet.id.startsWith("catalog-"),
      ),
    ).toBe(true);
  });

  it("avoids sparse single-item sections outside recommendations", () => {
    const sections = getCategorizedSnippets().filter(
      (section) => section.category !== "recommended",
    );
    expect(sections.every((section) => section.snippets.length !== 1)).toBe(
      true,
    );
  });

  it("keeps the completion catalog expanded with all example algorithms", () => {
    const catalogAlgorithms = completionSnippetCatalog.filter((snippet) =>
      snippet.id.startsWith("catalog-"),
    );

    expect(catalogAlgorithms).toHaveLength(100);
  });

  it("localizes insert text when using english snippets", () => {
    const binarySearchSnippet = snippetCatalog.find(
      (snippet) => snippet.id === "template-binary-search",
    );

    expect(binarySearchSnippet).toBeDefined();
    expect(localizeSnippet(binarySearchSnippet!, "en").insertText).toContain(
      "binarySearch(A[n], x, start, end) BEGIN",
    );
  });
});
