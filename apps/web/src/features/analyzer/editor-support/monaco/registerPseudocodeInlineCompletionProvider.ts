import type * as Monaco from "monaco-editor";

import type { EditorContext } from "@/features/analyzer/manual-guidance/context/types";
import type { GuidanceRecommendation } from "@/features/analyzer/manual-guidance/recommendations/types";

import { buildSnippetCandidates } from "./completionCandidates";
import {
  buildRecommendationInlineEdit,
  resolveGhostSuggestion,
} from "./recommendationInlineEdit";
import { localizeSnippet } from "../catalog/snippetCatalog";

export interface DismissedGhostSuggestion {
  readonly id: string;
  readonly lineNumber: number;
  readonly lineContent: string;
}

export interface PseudocodeInlineRecommendationState {
  readonly context: EditorContext | null;
  readonly locale: string;
  readonly forcedRecommendation?: GuidanceRecommendation | null;
  readonly dismissed?: DismissedGhostSuggestion | null;
  readonly inSnippet?: boolean;
}

const REGISTERED_INLINE_PROVIDERS = new WeakMap<
  typeof Monaco,
  Monaco.IDisposable
>();

function inlineInsertText(text: string): string | { readonly snippet: string } {
  return /\$\{/u.test(text) ? { snippet: text } : text;
}

function prefixSnippetCompletion(
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
  linePrefix: string,
  locale: string,
  location: EditorContext["location"]["primary"],
): Monaco.languages.InlineCompletions | null {
  const typed = /([A-Za-z_][A-Za-z0-9_]*)$/u.exec(linePrefix)?.[1];
  if (!typed || typed.length < 2) return null;

  const snippet = buildSnippetCandidates(
    typed,
    locale === "en" ? "en" : "es",
    location,
  )[0]?.snippet;
  if (!snippet) return null;

  const keyword = /^[A-Za-z_]+/u.exec(snippet.insertText)?.[0] ?? "";
  if (!keyword.startsWith(typed)) return null;

  let text = localizeSnippet(snippet, locale === "en" ? "en" : "es").insertText;
  const lineEnd = model.getLineMaxColumn(position.lineNumber);
  let range: Monaco.IRange = {
    startLineNumber: position.lineNumber,
    startColumn: position.column - typed.length,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  };
  if (text.includes("\n") && range.endColumn < lineEnd) {
    const suffix = model
      .getLineContent(position.lineNumber)
      .slice(range.endColumn - 1);
    if (suffix && !text.endsWith(suffix)) text += suffix;
    range = { ...range, endColumn: lineEnd };
  }

  return {
    items: [
      {
        insertText: inlineInsertText(text),
        range,
      },
    ],
  };
}

export function registerPseudocodeInlineCompletionProvider(
  monaco: typeof Monaco,
  getState: () => PseudocodeInlineRecommendationState,
) {
  REGISTERED_INLINE_PROVIDERS.get(monaco)?.dispose();

  const disposable = monaco.languages.registerInlineCompletionsProvider(
    "pseudocode",
    {
      provideInlineCompletions(model, position) {
        const state = getState();
        const context = state.context;
        if (!context || state.inSnippet) return { items: [] };

        const line = model.getLineContent(position.lineNumber);
        const linePrefix = line.slice(0, position.column - 1);
        const lineSuffix = line.slice(position.column - 1);
        const dismissed =
          state.dismissed &&
          state.dismissed.lineNumber === position.lineNumber &&
          state.dismissed.lineContent === line
            ? state.dismissed.id
            : null;
        const recommendation = resolveGhostSuggestion(
          context,
          linePrefix,
          lineSuffix,
          {
            forced: state.forcedRecommendation,
            dismissedId: dismissed,
            locale: state.locale,
          },
        );
        if (!recommendation) {
          return (
            prefixSnippetCompletion(
              model,
              position,
              linePrefix,
              state.locale,
              context.location.primary,
            ) ?? { items: [] }
          );
        }

        const edit = buildRecommendationInlineEdit(
          model,
          recommendation,
          context,
          state.locale,
          position,
        );
        if (!edit || edit.range.startLineNumber !== edit.range.endLineNumber) {
          return { items: [] };
        }

        let text = edit.text;
        let range = edit.range;
        const lineEnd = model.getLineMaxColumn(range.endLineNumber);
        if (text.includes("\n") && range.endColumn < lineEnd) {
          const suffix = model
            .getLineContent(range.endLineNumber)
            .slice(range.endColumn - 1);
          if (suffix && !text.endsWith(suffix)) text += suffix;
          range = { ...range, endColumn: lineEnd };
        }

        return {
          items: [
            {
              insertText: inlineInsertText(text),
              range,
            },
          ],
        };
      },
      disposeInlineCompletions() {
        // Monaco owns the completion lifetime. There is no external resource.
      },
    },
  );

  REGISTERED_INLINE_PROVIDERS.set(monaco, disposable);
  return disposable;
}
