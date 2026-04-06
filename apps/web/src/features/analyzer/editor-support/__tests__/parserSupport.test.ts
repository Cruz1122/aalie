import { getImportNormalizationSuggestions } from "../parser/normalizeImportSuggestions";
import { mapParseErrorsToSyntaxHints } from "../parser/syntaxHintMapper";

describe("parser support helpers", () => {
  it("detects unicode normalization suggestions without mutating text", () => {
    const suggestions = getImportNormalizationSuggestions(
      "a 🡨 b;\n► comentario\nx ≤ y",
    );
    expect(suggestions.map((item) => item.to)).toEqual(
      expect.arrayContaining(["<-", "//", "<="]),
    );
  });

  it("maps parser errors to pedagogical hints", () => {
    const hints = mapParseErrorsToSyntaxHints([
      { line: 4, column: 2, message: "missing END at 'ELSE'" },
    ]);

    expect(hints[0]?.code).toBe("missing-end");
    expect(hints[0]?.message).toContain("Falta END");
  });
});
