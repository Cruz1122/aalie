import type * as Monaco from "monaco-editor";

import { resolveEditorContext } from "@/features/analyzer/manual-guidance/context/resolveEditorContext";
import type { GuidanceRecommendation } from "@/features/analyzer/manual-guidance/recommendations/types";

import { buildRecommendationInlineEdit } from "../recommendationInlineEdit";
import {
  registerPseudocodeInlineCompletionProvider,
  type PseudocodeInlineRecommendationState,
} from "../registerPseudocodeInlineCompletionProvider";

function recommendation(
  id: string,
  snippetId?: string,
): GuidanceRecommendation {
  return {
    id,
    snippetId,
    intent: "statement",
    action: "insert",
    priority: 1,
    reason: "inside-body",
  };
}

function createModel(source: string) {
  const lines = source.split("\n");
  const offsetAt = (lineNumber: number, column: number) => {
    let offset = 0;
    for (let line = 1; line < lineNumber; line += 1) {
      offset += (lines[line - 1]?.length ?? 0) + 1;
    }
    return offset + column - 1;
  };

  return {
    getValue: () => source,
    getLineContent: (lineNumber: number) => lines[lineNumber - 1] ?? "",
    getLineMaxColumn: (lineNumber: number) =>
      (lines[lineNumber - 1]?.length ?? 0) + 1,
    getOffsetAt: (position: { lineNumber: number; column: number }) =>
      offsetAt(position.lineNumber, position.column),
    getPositionAt: (offset: number) => {
      let remaining = offset;
      for (let line = 1; line <= lines.length; line += 1) {
        const length = lines[line - 1]?.length ?? 0;
        if (remaining <= length) {
          return { lineNumber: line, column: remaining + 1 };
        }
        remaining -= length + 1;
      }
      const last = Math.max(lines.length, 1);
      return {
        lineNumber: last,
        column: (lines[last - 1]?.length ?? 0) + 1,
      };
    },
    getValueInRange: (range: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    }) =>
      source.slice(
        offsetAt(range.startLineNumber, range.startColumn),
        offsetAt(range.endLineNumber, range.endColumn),
      ),
  };
}

function register(state: PseudocodeInlineRecommendationState) {
  let provider: Monaco.languages.InlineCompletionsProvider | undefined;
  const monaco = {
    languages: {
      registerInlineCompletionsProvider: vi.fn(
        (
          _language: Monaco.languages.LanguageSelector,
          value: Monaco.languages.InlineCompletionsProvider,
        ) => {
          provider = value;
          return { dispose: vi.fn() };
        },
      ),
    },
  } as unknown as typeof Monaco;
  registerPseudocodeInlineCompletionProvider(monaco, () => state);
  return provider;
}

describe("registerPseudocodeInlineCompletionProvider", () => {
  it("offers the top insertable recommendation as a snippet on an empty line", () => {
    const source = "suma(n) BEGIN\n  ";
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 2, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });
    const provider = register({ context, locale: "en" });

    const result = provider?.provideInlineCompletions(
      createModel(source) as unknown as Monaco.editor.ITextModel,
      { lineNumber: 2, column: 3 } as Monaco.Position,
      {} as Monaco.languages.InlineCompletionContext,
      {} as Monaco.CancellationToken,
    );

    expect(result).toMatchObject({
      items: [
        {
          insertText: { snippet: "  ${1:variable} <- ${2:n};" },
          range: {
            startLineNumber: 2,
            startColumn: 1,
            endLineNumber: 2,
            endColumn: 3,
          },
        },
      ],
    });
  });

  it("keeps END on its own line when the ghost is accepted there", () => {
    const source = "suma(n) BEGIN\nEND";
    const endOffset = source.lastIndexOf("END");
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 0, offset: endOffset },
      parseResult: { status: "invalid", errors: [] },
    });
    const provider = register({ context, locale: "en" });

    const result = provider?.provideInlineCompletions(
      createModel(source) as unknown as Monaco.editor.ITextModel,
      { lineNumber: 2, column: 1 } as Monaco.Position,
      {} as Monaco.languages.InlineCompletionContext,
      {} as Monaco.CancellationToken,
    );
    const item = (
      result as {
        items: Array<{
          insertText: { snippet: string };
          range: Monaco.IRange;
        }>;
      }
    ).items[0];

    expect(item?.insertText.snippet).toBe("  ${1:variable} <- ${2:n};\nEND");
    expect(item?.range).toMatchObject({
      startLineNumber: 2,
      startColumn: 1,
      endLineNumber: 2,
      endColumn: 4,
    });
    expect(item?.insertText.snippet).not.toMatch(/n;END/);
  });

  it("keeps the editable placeholder inside the prepared snippet", () => {
    const assignmentSource = "suma(n) BEGIN\n  ";
    const assignmentContext = resolveEditorContext({
      source: assignmentSource,
      cursor: {
        line: 2,
        column: 2,
        offset: assignmentSource.length,
      },
      parseResult: { status: "invalid", errors: [] },
    });
    const assignment = buildRecommendationInlineEdit(
      createModel(assignmentSource) as unknown as Monaco.editor.ITextModel,
      recommendation("assign", "assign"),
      assignmentContext,
      "en",
      { lineNumber: 2, column: 3 },
    );
    expect(assignment?.text).toContain("${1:variable}");
    expect(
      assignment?.text.slice(
        assignment.selectionStart,
        assignment.selectionEnd,
      ),
    ).toBe("variable");
  });

  it("returns no ghost while a word is being typed", () => {
    const source = "hola";
    const context = resolveEditorContext({
      source,
      cursor: { line: 1, column: source.length, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });
    const provider = register({
      context,
      forcedRecommendation: recommendation(
        "algorithm-header",
        "algorithm-header",
      ),
      locale: "es",
    });

    const result = provider?.provideInlineCompletions(
      createModel(source) as unknown as Monaco.editor.ITextModel,
      { lineNumber: 1, column: source.length + 1 } as Monaco.Position,
      {} as Monaco.languages.InlineCompletionContext,
      {} as Monaco.CancellationToken,
    );

    expect(result).toEqual({ items: [] });
  });

  it("offers the matching keyword as ghost text while typing", () => {
    const source = "suma(n) BEGIN\n  WH";
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 4, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });
    const provider = register({ context, locale: "es" });

    const result = provider?.provideInlineCompletions(
      createModel(source) as unknown as Monaco.editor.ITextModel,
      { lineNumber: 2, column: 5 } as Monaco.Position,
      {} as Monaco.languages.InlineCompletionContext,
      {} as Monaco.CancellationToken,
    );

    expect(result).toEqual({
      items: [
        {
          insertText: {
            snippet: "WHILE (${1:condicion}) DO BEGIN\n  ${2}\nEND",
          },
          range: {
            startLineNumber: 2,
            startColumn: 3,
            endLineNumber: 2,
            endColumn: 5,
          },
        },
      ],
    });
  });

  it("uses the tutorial suggestion instead of the ranked default", () => {
    const source = "suma(n) BEGIN\n  ";
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 2, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });
    const provider = register({
      context,
      locale: "en",
      forcedRecommendation: recommendation("if", "if"),
    });

    const result = provider?.provideInlineCompletions(
      createModel(source) as unknown as Monaco.editor.ITextModel,
      { lineNumber: 2, column: 3 } as Monaco.Position,
      {} as Monaco.languages.InlineCompletionContext,
      {} as Monaco.CancellationToken,
    );

    expect(result).toMatchObject({
      items: [
        {
          insertText: {
            snippet: "  IF (${1:n > 0}) THEN BEGIN\n    ${2}\n  END",
          },
        },
      ],
    });
  });

  it("does not repeat a suggestion dismissed on the same line", () => {
    const source = "suma(n) BEGIN\n  ";
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 2, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });
    const provider = register({
      context,
      locale: "en",
      dismissed: {
        id: "assign",
        lineNumber: 2,
        lineContent: "  ",
      },
    });

    const result = provider?.provideInlineCompletions(
      createModel(source) as unknown as Monaco.editor.ITextModel,
      { lineNumber: 2, column: 3 } as Monaco.Position,
      {} as Monaco.languages.InlineCompletionContext,
      {} as Monaco.CancellationToken,
    );
    const item = (
      result as { items: Array<{ insertText: { snippet: string } }> }
    ).items[0];

    expect(item?.insertText.snippet.startsWith("  IF (")).toBe(true);
  });

  it("offers the algorithm header on an empty document", () => {
    const context = resolveEditorContext({
      source: "",
      cursor: { line: 1, column: 0, offset: 0 },
      parseResult: { status: "idle", errors: [] },
    });
    const provider = register({ context, locale: "es" });

    const result = provider?.provideInlineCompletions(
      createModel("") as unknown as Monaco.editor.ITextModel,
      { lineNumber: 1, column: 1 } as Monaco.Position,
      {} as Monaco.languages.InlineCompletionContext,
      {} as Monaco.CancellationToken,
    );

    expect(result).toMatchObject({
      items: [
        {
          insertText: {
            snippet: "${1:nombre}(${2:parametros}) BEGIN\n  ${3}\nEND",
          },
        },
      ],
    });
  });
});
