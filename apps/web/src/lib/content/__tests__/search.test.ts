import { describe, expect, it } from "vitest";

import { searchContentIndex } from "@/lib/content/search";
import { getUserGuideLandingFixture } from "@/test/user-guide-fixtures";

describe("searchContentIndex", () => {
  const landing = getUserGuideLandingFixture("es");

  it("finds troubleshooting content by English parser term", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "semicolon",
    );

    expect(results[0]?.entry.title).toBe("missing semicolon");
    expect(results[0]?.entry.route).toBe(
      "/user-guide/solucion-de-problemas#missing-semicolon",
    );
  });

  it("prioritizes grammar sections for control-flow syntax", () => {
    const results = searchContentIndex(landing.searchIndex, landing.modules, "FOR");

    expect(results[0]?.entry.title).toBe("Estructuras de control");
    expect(results[0]?.moduleTitle).toBe("Sintaxis de la gramática");
  });

  it("resolves CALL to the syntax module", () => {
    const results = searchContentIndex(landing.searchIndex, landing.modules, "CALL");

    expect(results[0]?.entry.title).toBe("Procedimientos y CALL");
    expect(results[0]?.entry.route).toBe(
      "/user-guide/sintaxis-de-la-gramatica#procedimientos-y-call",
    );
  });

  it("finds analysis workflow entries from a natural query", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "analizar complejidad",
    );

    expect(results[0]?.entry.title).toBe("Flujo desde el editor");
    expect(results[0]?.moduleTitle).toBe("Análisis de complejidad");
  });

  it("keeps troubleshooting results discoverable for exact parser errors", () => {
    const results = searchContentIndex(
      landing.searchIndex,
      landing.modules,
      "unexpected token",
    );

    expect(results[0]?.entry.title).toBe("unexpected token");
    expect(results[0]?.entry.route).toBe(
      "/user-guide/solucion-de-problemas#unexpected-token",
    );
  });
});
