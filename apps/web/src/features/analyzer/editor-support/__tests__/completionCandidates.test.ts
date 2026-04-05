import {
  buildCompletionCandidates,
  buildSnippetCandidates,
  extractIdentifierCandidates,
} from "../monaco/completionCandidates";

describe("completion candidates", () => {
  const source = [
    "binarySearch(A[n], n, x) BEGIN",
    "  left <- 1;",
    "  right <- n;",
    "  FOR i <- 1 TO n DO BEGIN",
    "    sum <- sum + A[i];",
    "  END",
    "  RETURN -1;",
    "END",
  ].join("\n");

  it("extracts parameters before variables without duplicates", () => {
    expect(extractIdentifierCandidates(source, "").map((item) => item.label)).toEqual(
      ["A", "n", "x", "left", "right", "i", "sum"],
    );
  });

  it("orders local identifiers before snippets and limits the list to five", () => {
    const candidates = buildCompletionCandidates(source, "", "en");

    expect(candidates).toHaveLength(5);
    expect(candidates.every((candidate) => candidate.type === "identifier")).toBe(
      true,
    );
    expect(candidates.map((candidate) => candidate.key)).toEqual([
      "parameter:a",
      "parameter:n",
      "parameter:x",
      "variable:left",
      "variable:right",
    ]);
  });

  it("keeps full algorithms after regular snippets and removes duplicate snippet entries", () => {
    const candidates = buildSnippetCandidates("binary", "en");
    const firstAlgorithmIndex = candidates.findIndex(
      (candidate) => candidate.snippetKind === "algorithm",
    );

    expect(firstAlgorithmIndex).toBeGreaterThan(0);
    expect(
      candidates
        .slice(0, firstAlgorithmIndex)
        .every((candidate) => candidate.snippetKind === "snippet"),
    ).toBe(true);
    expect(new Set(candidates.map((candidate) => candidate.key)).size).toBe(
      candidates.length,
    );
  });
});
