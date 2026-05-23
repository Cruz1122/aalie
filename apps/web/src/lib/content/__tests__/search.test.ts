import { describe, expect, it } from "vitest";

import { searchContentIndex } from "@/lib/content/search";
import { getUserGuideLandingFixture } from "@/test/user-guide-fixtures";

describe("searchContentIndex", () => {
  const landing = getUserGuideLandingFixture("es");

  it("finds the analyzer module by relevant keyword", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "analizador",
    );

    expect(results[0]?.moduleTitle).toBe("Analiza un algoritmo paso a paso");
    expect(results[0]?.entry.route).toMatch(
      /\/user-guide\/linear-search-analyzer/,
    );
  });

  it("finds the linear search section by distinctive phrase", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "búsqueda lineal",
    );

    expect(results[0]?.moduleTitle).toBe("Analiza un algoritmo paso a paso");
    expect(results[0]?.entry.route).toMatch(
      /\/user-guide\/linear-search-analyzer/,
    );
  });

  it("resolves Fibonacci to the recursive module", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "Fibonacci",
    );

    expect(results[0]?.moduleTitle).toBe(
      "Analiza un algoritmo recursivo con Fibonacci",
    );
    expect(results[0]?.entry.route).toMatch(
      /\/user-guide\/recursive-fibonacci/,
    );
  });

  it("finds recurrencia content from a natural query", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "recurrencia",
    );

    expect(results[0]?.entry.title.toLowerCase()).toContain("recurrencia");
    expect(results[0]?.moduleTitle).toBe(
      "Analiza un algoritmo recursivo con Fibonacci",
    );
  });

  it("finds PDF export module by file type keyword", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "PDF",
    );

    expect(results[0]?.moduleTitle).toBe("Exporta resultados a PDF");
    expect(results[0]?.entry.route).toMatch(/\/user-guide\/export-pdf/);
  });
});
