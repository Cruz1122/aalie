import type * as Monaco from "monaco-editor";

import { resolveEditorContext } from "@/features/analyzer/manual-guidance/context/resolveEditorContext";
import type { GuidanceRecommendation } from "@/features/analyzer/manual-guidance/recommendations/types";

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

describe("registerPseudocodeInlineCompletionProvider", () => {
  it("returns the active recommendation as one inline snippet", () => {
    const source = "suma(n) BEGIN\n  ";
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 2, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });
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
    const state: PseudocodeInlineRecommendationState = {
      context,
      recommendation: recommendation("assign", "assign"),
      locale: "en",
    };

    registerPseudocodeInlineCompletionProvider(monaco, () => state);

    const result = provider?.provideInlineCompletions(
      {
        getValue: () => source,
        getLineContent: () => "  ",
        getOffsetAt: () => source.length,
      } as unknown as Monaco.editor.ITextModel,
      { lineNumber: 2, column: 3 } as Monaco.Position,
      {} as Monaco.languages.InlineCompletionContext,
      {} as Monaco.CancellationToken,
    );

    expect(result).toMatchObject({
      items: [
        {
          insertText: { snippet: "${1:variable} <- ${2:value};" },
        },
      ],
    });
  });

  it("returns no ghost for analysis-only recommendations", () => {
    const source = "suma(n) BEGIN\nEND";
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 3, offset: source.length },
      parseResult: { status: "valid", errors: [] },
    });
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
    const state: PseudocodeInlineRecommendationState = {
      context,
      recommendation: {
        ...recommendation("analyze"),
        intent: "analysis",
        action: "analyze",
      },
      locale: "es",
    };

    registerPseudocodeInlineCompletionProvider(monaco, () => state);

    const result = provider?.provideInlineCompletions(
      {
        getValue: () => source,
        getLineContent: () => "END",
        getOffsetAt: () => source.length,
      } as unknown as Monaco.editor.ITextModel,
      { lineNumber: 2, column: 4 } as Monaco.Position,
      {} as Monaco.languages.InlineCompletionContext,
      {} as Monaco.CancellationToken,
    );

    expect(result).toEqual({ items: [] });
  });

  it("replaces a typed header name with the correlated dynamic ghost", () => {
    const source = "hola";
    const context = resolveEditorContext({
      source,
      cursor: { line: 1, column: source.length, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });
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

    registerPseudocodeInlineCompletionProvider(monaco, () => ({
      context,
      recommendation: {
        id: "algorithm-header",
        snippetId: "algorithm-header",
        intent: "start",
        action: "insert",
        priority: 1000,
        reason: "inside-body",
      },
      locale: "es",
    }));

    const result = provider?.provideInlineCompletions(
      {
        getValue: () => source,
        getLineContent: () => source,
        getOffsetAt: () => source.length,
        getPositionAt: (offset: number) => ({
          lineNumber: 1,
          column: offset + 1,
        }),
        getLineMaxColumn: () => source.length + 1,
      } as unknown as Monaco.editor.ITextModel,
      { lineNumber: 1, column: source.length + 1 } as Monaco.Position,
      {} as Monaco.languages.InlineCompletionContext,
      {} as Monaco.CancellationToken,
    );

    expect(result).toMatchObject({
      items: [
        {
          insertText: {
            snippet: "${1:hola}(${2:parametros}) BEGIN\n  ${3}\nEND",
          },
          range: {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 5,
          },
        },
      ],
    });
  });
});
