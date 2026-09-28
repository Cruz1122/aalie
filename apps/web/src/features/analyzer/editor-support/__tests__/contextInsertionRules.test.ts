import { getSnippetById, localizeSnippet } from "../catalog/snippetCatalog";
import {
  applyContextIndentation,
  buildSnippetInsertionText,
  getSnippetSelectionOffsets,
  resolveSnippetPlainText,
} from "../monaco/contextInsertionRules";

describe("context insertion rules", () => {
  it("replaces snippet placeholders with plain defaults", () => {
    expect(
      resolveSnippetPlainText(
        "FOR ${1:i} <- ${2:1} TO ${3:n} DO BEGIN\n  ${4}\nEND",
      ),
    ).toBe("FOR i <- 1 TO n DO BEGIN\n  \nEND");
  });

  it("wraps selected text before resolving the final insertion", () => {
    const snippet = getSnippetById("if");

    expect(snippet).toBeTruthy();
    expect(
      resolveSnippetPlainText(
        buildSnippetInsertionText(snippet!, "x <- x + 1;"),
      ),
    ).toBe("IF (condicion) THEN BEGIN\n  x <- x + 1;\nEND");
  });

  it("keeps the closing line indented in nested block insertions", () => {
    expect(
      applyContextIndentation(
        resolveSnippetPlainText("WHILE (${1:condicion}) DO BEGIN\n  ${2}\nEND"),
        "  ",
      ),
    ).toBe("WHILE (condicion) DO BEGIN\n    \n  END");
  });

  it("selects the loop counter instead of a letter inside END", () => {
    const snippet = getSnippetById("for");
    expect(snippet).toBeTruthy();
    const localized = localizeSnippet(snippet!, "es");
    const plain = resolveSnippetPlainText(localized.insertText);
    const selection = getSnippetSelectionOffsets(localized, plain);

    expect(plain.slice(selection?.start, selection?.end)).toBe("i");
  });
});
