import { describe, expect, it } from "vitest";

import { normalizeAssistantMarkdown } from "@/lib/assistant-response-format";

describe("normalizeAssistantMarkdown", () => {
  it("wraps unfenced pseudocode and keeps the explanation outside the block", () => {
    const content =
      "bubbleSort(A, n) BEGIN i <- 0; WHILE (i < n - 1) DO BEGIN j <- 0; WHILE (j < n - i - 1) DO BEGIN IF (A[j] > A[j + 1]) THEN BEGIN temp <- A[j]; A[j] <- A[j + 1]; A[j + 1] <- temp; END j <- j + 1; END i <- i + 1; END END Este pseudocódigo ordena el arreglo.";

    expect(normalizeAssistantMarkdown(content)).toBe(
      "```pseudocode\n" +
        "bubbleSort(A, n) BEGIN i <- 0; WHILE (i < n - 1) DO BEGIN j <- 0; WHILE (j < n - i - 1) DO BEGIN IF (A[j] > A[j + 1]) THEN BEGIN temp <- A[j]; A[j] <- A[j + 1]; A[j + 1] <- temp; END j <- j + 1; END i <- i + 1; END END\n" +
        "```\n\n" +
        "Este pseudocódigo ordena el arreglo.",
    );
  });

  it("does not alter an already fenced response", () => {
    const content = "```pseudocode\nfoo(A) BEGIN\nEND\n```\n\nExplicación.";

    expect(normalizeAssistantMarkdown(content)).toBe(content);
  });

  it("leaves ordinary explanations unchanged", () => {
    const content = "La complejidad temporal es O(n log n).";

    expect(normalizeAssistantMarkdown(content)).toBe(content);
  });
});
