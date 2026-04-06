import { describe, expect, it } from "vitest";

import { searchContentIndex } from "@/lib/content/search";
import { getUserGuideLandingFixture } from "@/test/user-guide-fixtures";

describe("searchContentIndex", () => {
  const landing = getUserGuideLandingFixture("es");

  it("finds the analysis limits module by partial keyword", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "parcial",
    );

    expect(results[0]?.entry.title.toLowerCase()).toContain("parcial");
    expect(results[0]?.entry.route).toMatch(
      /\/user-guide\/limites-del-analisis#/,
    );
  });

  it("finds the minimal syntax section by distinctive phrase", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "sintaxis mínima",
    );

    expect(results[0]?.entry.title).toBe("Sintaxis mínima para seguir la guía");
    expect(results[0]?.moduleTitle).toBe("Cómo se mide un algoritmo");
  });

  it("resolves CALL to the first module syntax section", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "CALL",
    );

    expect(results[0]?.entry.title).toBe("Sintaxis mínima para seguir la guía");
    expect(results[0]?.entry.route).toBe(
      "/user-guide/como-se-mide-un-algoritmo#sintaxis-minima",
    );
  });

  it("finds recursive module from a natural query", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "recurrencia",
    );

    expect(results[0]?.entry.title.toLowerCase()).toContain("recurrencia");
    expect(results[0]?.moduleTitle).toBe("Algoritmos recursivos");
  });

  it("keeps troubleshooting-style sections discoverable for warnings", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "advertencias",
    );

    expect(results[0]?.entry.title.toLowerCase()).toContain("advertencias");
    expect(results[0]?.entry.route).toMatch(
      /\/user-guide\/limites-del-analisis#/,
    );
  });
});
