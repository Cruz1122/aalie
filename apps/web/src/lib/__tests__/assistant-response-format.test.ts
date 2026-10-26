import { describe, expect, it } from "vitest";

import { normalizeAssistantMarkdown } from "@/lib/assistant-response-format";

describe("normalizeAssistantMarkdown", () => {
  it("wraps unfenced pseudocode and keeps the explanation outside the block", () => {
    const content =
      "bubbleSort(A, n) BEGIN i <- 0; WHILE (i < n - 1) DO BEGIN j <- 0; WHILE (j < n - i - 1) DO BEGIN IF (A[j] > A[j + 1]) THEN BEGIN temp <- A[j]; A[j] <- A[j + 1]; A[j + 1] <- temp; END j <- j + 1; END i <- i + 1; END END Este pseudocódigo ordena el arreglo.";

    expect(normalizeAssistantMarkdown(content)).toBe(
      "```pseudocode\n" +
        "bubbleSort(A, n) BEGIN\n" +
        "    i <- 0;\n" +
        "    WHILE (i < n - 1) DO BEGIN\n" +
        "        j <- 0;\n" +
        "        WHILE (j < n - i - 1) DO BEGIN\n" +
        "            IF (A[j] > A[j + 1]) THEN BEGIN\n" +
        "                temp <- A[j];\n" +
        "                A[j] <- A[j + 1];\n" +
        "                A[j + 1] <- temp;\n" +
        "            END\n" +
        "            j <- j + 1;\n" +
        "        END\n" +
        "        i <- i + 1;\n" +
        "    END\n" +
        "END\n" +
        "```\n\n" +
        "Este pseudocódigo ordena el arreglo.",
    );
  });

  it("does not alter an already fenced response", () => {
    const content = "```pseudocode\nfoo(A) BEGIN\nEND\n```\n\nExplicación.";

    expect(normalizeAssistantMarkdown(content)).toBe(content);
  });

  it("restores indentation inside a flat pseudocode fence", () => {
    const content =
      "```pseudocode\n" +
      "sumar(n) BEGIN total <- 0; FOR i <- 1 TO n DO BEGIN total <- total + i; END RETURN total; END\n" +
      "```";

    expect(normalizeAssistantMarkdown(content)).toBe(
      "```pseudocode\n" +
        "sumar(n) BEGIN\n" +
        "    total <- 0;\n" +
        "    FOR i <- 1 TO n DO BEGIN\n" +
        "        total <- total + i;\n" +
        "    END\n" +
        "    RETURN total;\n" +
        "END\n" +
        "```",
    );
  });

  it("restores indentation inside a tilde pseudocode fence", () => {
    const content = "~~~pseudocode\nfoo() BEGIN x <- 0; END\n~~~";

    expect(normalizeAssistantMarkdown(content)).toBe(
      "~~~pseudocode\nfoo() BEGIN\n    x <- 0;\nEND\n~~~",
    );
  });

  it("preserves existing pseudocode indentation and code strings", () => {
    const content =
      '```pseudocode\nmostrar() BEGIN\n    print("BEGIN; END");\nEND\n```';

    expect(normalizeAssistantMarkdown(content)).toBe(content);
  });

  it("formats multiple statements on a partially indented line", () => {
    const content =
      "```pseudocode\n" + "foo() BEGIN\n" + "    x <- 0; y <- 1; END\n" + "```";

    expect(normalizeAssistantMarkdown(content)).toBe(
      "```pseudocode\n" +
        "foo() BEGIN\n" +
        "    x <- 0;\n" +
        "    y <- 1;\n" +
        "END\n" +
        "```",
    );
  });

  it("does not split block keywords or semicolons inside flat code strings", () => {
    const content =
      '```pseudocode\nmostrar() BEGIN print("BEGIN; END"); END\n```';

    expect(normalizeAssistantMarkdown(content)).toBe(
      '```pseudocode\nmostrar() BEGIN\n    print("BEGIN; END");\nEND\n```',
    );
  });

  it("preserves project line comments while formatting a flat pseudocode fence", () => {
    const content =
      "```pseudocode\n" +
      "foo() BEGIN x <- 0; ► mentions ; BEGIN and END\n" +
      "x <- 1; END\n" +
      "```";

    expect(normalizeAssistantMarkdown(content)).toBe(
      "```pseudocode\n" +
        "foo() BEGIN\n" +
        "    x <- 0;\n" +
        "    ► mentions ; BEGIN and END\n" +
        "    x <- 1;\n" +
        "END\n" +
        "```",
    );
  });

  it("finds the end of unfenced pseudocode past project line comments", () => {
    const content =
      "Introducción.\n" +
      "foo() BEGIN ► mentions ; BEGIN and END\n" +
      "x <- 1; END\n" +
      "Conclusión.";

    expect(normalizeAssistantMarkdown(content)).toBe(
      "Introducción.\n\n" +
        "```pseudocode\n" +
        "foo() BEGIN\n" +
        "    ► mentions ; BEGIN and END\n" +
        "    x <- 1;\n" +
        "END\n" +
        "```\n\n" +
        "Conclusión.",
    );
  });

  it("leaves ordinary explanations unchanged", () => {
    const content = "La complejidad temporal es O(n log n).";

    expect(normalizeAssistantMarkdown(content)).toBe(content);
  });
});
