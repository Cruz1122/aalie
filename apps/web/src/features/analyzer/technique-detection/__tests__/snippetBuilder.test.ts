import { describe, expect, it } from "vitest";

import { parseSourceToAst } from "./parseSourceToAst";
import { collectTechniqueFacts } from "../analysis/collectFacts";
import { buildCompactSnippet } from "../evidence/snippetBuilder";
import { detectTechniqueFromAst } from "../index";

describe("snippetBuilder", () => {
  it("builds a compact snippet from indexed evidence items", () => {
    const ast = parseSourceToAst(`
fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
`);

    const facts = collectTechniqueFacts(ast as never);
    const callNodeIds = facts.recursion.calls.map((call) => call.nodeId);
    const snippet = buildCompactSnippet(
      facts,
      callNodeIds.map((nodeId) => ({
        role: "recursive_call" as const,
        nodeId,
        importance: "primary" as const,
      })),
    );

    expect(snippet).toContain("fibonacci");
    expect(snippet.split("\n").length).toBeGreaterThanOrEqual(2);
  });

  it("builds a visible snippet for recursive binary search divide-and-conquer", () => {
    const source = `
binarySearchRec(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    mitad <- (inicio + fin) DIV 2;
    IF (A[mitad] = x) THEN BEGIN
        RETURN mitad;
    END
    ELSE BEGIN
        IF (x < A[mitad]) THEN BEGIN
            RETURN binarySearchRec(A, x, inicio, mitad - 1);
        END
        ELSE BEGIN
            RETURN binarySearchRec(A, x, mitad + 1, fin);
        END
    END
END
`;

    const ast = parseSourceToAst(source);
    const result = detectTechniqueFromAst(ast, source);

    expect(result.technique).toBe("divide_and_conquer");
    expect(result.evidence.compactSnippet.trim().length).toBeGreaterThan(0);
    expect(result.evidence.compactSnippet).toMatch(
      /mitad|binarySearchRec|A\[mitad\]/,
    );
  });
});
