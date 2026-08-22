import type * as Monaco from "monaco-editor";

import {
  isRecommendationCurrent,
  resolveRecommendationInsertion,
} from "@/features/analyzer/manual-guidance/recommendations";
import type { EditorContext } from "@/features/analyzer/manual-guidance/context/types";
import type {
  GuidanceRecommendation,
} from "@/features/analyzer/manual-guidance/recommendations/types";

export interface PseudocodeInlineRecommendationState {
  readonly context: EditorContext | null;
  readonly recommendation: GuidanceRecommendation | null;
  readonly locale: string;
}

const REGISTERED_INLINE_PROVIDERS = new WeakMap<
  typeof Monaco,
  Monaco.IDisposable
>();

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
        const recommendation = state.recommendation;

        if (
          !context ||
          !recommendation ||
          model.getValue() !== context.document.source ||
          model.getOffsetAt(position) !== context.cursor.offset ||
          !isRecommendationCurrent(recommendation, context)
        ) {
          return { items: [] };
        }

        const linePrefix = model
          .getLineContent(position.lineNumber)
          .slice(0, position.column - 1);
        const insertion = resolveRecommendationInsertion(
          recommendation,
          context,
          state.locale,
          linePrefix,
        );

        if (!insertion) return { items: [] };

        const range =
          insertion.replaceStartOffset !== undefined &&
          insertion.replaceEndOffset !== undefined
            ? {
                start: model.getPositionAt(insertion.replaceStartOffset),
                end: model.getPositionAt(insertion.replaceEndOffset),
              }
            : {
                start: position,
                end: {
                  lineNumber: position.lineNumber,
                  column: insertion.snippetText.includes("\n")
                    ? model.getLineMaxColumn(position.lineNumber)
                    : position.column,
                },
              };

        if (range.start.lineNumber !== range.end.lineNumber) {
          return { items: [] };
        }

        return {
          items: [
            {
              insertText: { snippet: insertion.snippetText },
              range: {
                startLineNumber: range.start.lineNumber,
                startColumn: range.start.column,
                endLineNumber: range.end.lineNumber,
                endColumn: range.end.column,
              },
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
