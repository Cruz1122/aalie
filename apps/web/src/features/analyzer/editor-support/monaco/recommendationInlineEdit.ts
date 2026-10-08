import type * as Monaco from "monaco-editor";

import type {
  EditorContext,
  EditorLocation,
} from "@/features/analyzer/manual-guidance/context/types";
import {
  rankRecommendations,
  resolveRecommendationInsertion,
} from "@/features/analyzer/manual-guidance/recommendations";
import type { GuidanceRecommendation } from "@/features/analyzer/manual-guidance/recommendations/types";

import {
  getSnippetSelectionOffsets,
  prepareSnippetInsertion,
  resolveSnippetPlainText,
} from "./contextInsertionRules";
import { getSnippetById, localizeSnippet } from "../catalog/snippetCatalog";

export interface RecommendationInlineEdit {
  readonly range: {
    readonly startLineNumber: number;
    readonly startColumn: number;
    readonly endLineNumber: number;
    readonly endColumn: number;
  };
  readonly text: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
}

function selectionInPreparedText(
  snippetId: string | undefined,
  snippetText: string,
  preparedText: string,
): { start: number; end: number } {
  if (!snippetId) {
    const placeholder = /^\$\{1:([^}]+)\}/u.exec(snippetText)?.[1];
    if (placeholder) {
      const start = preparedText.indexOf(placeholder);
      if (start >= 0) return { start, end: start + placeholder.length };
    }
    return { start: 0, end: preparedText.length };
  }

  const snippet = getSnippetById(snippetId);
  if (!snippet) return { start: preparedText.length, end: preparedText.length };

  const offsets = getSnippetSelectionOffsets(
    { ...localizeSnippet(snippet, "es"), insertText: snippetText },
    preparedText,
  );
  return offsets ?? { start: preparedText.length, end: preparedText.length };
}

const EXPRESSION_LOCATIONS = new Set<EditorLocation>([
  "CONDITION",
  "EXPRESSION",
  "RETURN_EXPRESSION",
]);

export function isGhostInsertionSlot(
  linePrefix: string,
  lineSuffix: string,
  location: EditorLocation,
): boolean {
  const restOfLine = lineSuffix.split(/\r?\n/u, 1)[0] ?? "";
  if (/[A-Za-z0-9_]$/u.test(linePrefix)) return false;
  if (
    /^\s*$/u.test(linePrefix) &&
    (/^\s*$/u.test(restOfLine) || /^\s*END\b/i.test(restOfLine))
  ) {
    return true;
  }
  if (!EXPRESSION_LOCATIONS.has(location)) return false;

  return (
    /(?:<=|>=|!=|=|<|>|\+|\*|\/|-|<-|:=)\s*$/u.test(linePrefix) ||
    /\b(?:AND|OR|NOT)\s*$/iu.test(linePrefix) ||
    /(?:[A-Za-z_][A-Za-z0-9_]*|\d+|\]|\))\s+$/u.test(linePrefix)
  );
}

function canForceRecommendation(
  recommendation: GuidanceRecommendation,
  context: EditorContext,
  locale: string,
  linePrefix: string,
): boolean {
  if (recommendation.action === "analyze") return false;
  if (
    EXPRESSION_LOCATIONS.has(context.location.primary) ||
    context.location.primary === "PARAMETER_LIST"
  ) {
    return false;
  }
  return Boolean(
    resolveRecommendationInsertion(recommendation, context, locale, linePrefix),
  );
}

export function resolveGhostSuggestion(
  context: EditorContext,
  linePrefix: string,
  lineSuffix: string,
  options: {
    readonly forced?: GuidanceRecommendation | null;
    readonly dismissedId?: string | null;
    readonly locale?: string;
  } = {},
): GuidanceRecommendation | null {
  if (
    context.selection.active &&
    context.selection.origin !== "placeholder" &&
    context.selection.origin !== "parameters"
  ) {
    return null;
  }
  if (!isGhostInsertionSlot(linePrefix, lineSuffix, context.location.primary)) {
    return null;
  }

  const locale = options.locale ?? "es";
  const forced = options.forced;
  if (
    forced &&
    forced.id !== options.dismissedId &&
    canForceRecommendation(forced, context, locale, linePrefix)
  ) {
    return forced;
  }

  return (
    rankRecommendations(context, { limit: 8 }).find(
      (recommendation) =>
        recommendation.action !== "analyze" &&
        recommendation.id !== options.dismissedId,
    ) ?? null
  );
}

export function buildRecommendationInlineEdit(
  model: Monaco.editor.ITextModel,
  recommendation: GuidanceRecommendation,
  context: EditorContext,
  locale: string,
  position: Pick<Monaco.IPosition, "lineNumber" | "column">,
): RecommendationInlineEdit | null {
  if (
    model.getValue() !== context.document.source ||
    model.getOffsetAt(position) !== context.cursor.offset
  ) {
    return null;
  }

  const linePrefix = model
    .getLineContent(position.lineNumber)
    .slice(0, position.column - 1);
  const insertion = resolveRecommendationInsertion(
    recommendation,
    context,
    locale,
    linePrefix,
  );
  if (!insertion) return null;

  if (
    insertion.snippetId &&
    insertion.replaceStartOffset === undefined &&
    insertion.replaceEndOffset === undefined
  ) {
    const snippet = getSnippetById(insertion.snippetId);
    if (!snippet || snippet.status === "hidden") return null;

    const prepared = prepareSnippetInsertion(
      model,
      snippet,
      {
        ...localizeSnippet(snippet, locale),
        insertText: insertion.snippetText,
      },
      {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
        positionLineNumber: position.lineNumber,
        positionColumn: position.column,
      },
    );
    const selection = selectionInPreparedText(
      insertion.snippetId,
      insertion.snippetText,
      prepared.insertionText,
    );

    return {
      range: prepared.targetRange,
      text: prepared.insertionText,
      selectionStart: selection.start,
      selectionEnd: selection.end,
    };
  }

  const text = insertion.snippetText;
  const replacesSelection =
    context.selection.active &&
    recommendation.id.endsWith("-parameter") &&
    (context.selection.origin === "parameters" ||
      context.location.primary === "PARAMETER_LIST");
  const start = replacesSelection
    ? model.getPositionAt(context.selection.startOffset)
    : insertion.replaceStartOffset === undefined
      ? position
      : model.getPositionAt(insertion.replaceStartOffset);
  const end = replacesSelection
    ? model.getPositionAt(context.selection.endOffset)
    : insertion.replaceEndOffset === undefined
      ? position
      : model.getPositionAt(insertion.replaceEndOffset);
  const selection = replacesSelection
    ? { start: 0, end: text.length }
    : selectionInPreparedText(insertion.snippetId, insertion.snippetText, text);

  return {
    range: {
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column,
    },
    text,
    selectionStart: selection.start,
    selectionEnd: selection.end,
  };
}

export function applyRecommendationInlineEdit(
  editor: Monaco.editor.IStandaloneCodeEditor,
  edit: RecommendationInlineEdit,
): void {
  const model = editor.getModel();
  if (!model) return;

  editor.focus();
  editor.trigger("editor-support", "editor.action.inlineSuggest.hide", {});
  editor.trigger("editor-support", "hideSuggest", {});
  const controller = editor.getContribution("snippetController2") as {
    insert?: (
      template: string,
      options?: {
        readonly adjustWhitespace?: boolean;
        readonly undoStopBefore?: boolean;
        readonly undoStopAfter?: boolean;
      },
    ) => void;
  } | null;

  editor.setSelection(edit.range);
  if (controller?.insert && /\$\{/u.test(edit.text)) {
    const disposable = editor.onDidChangeModelContent((event) => {
      disposable.dispose();
      const change = event.changes[0];
      if (!change) return;
      const startOffset = model.getOffsetAt({
        lineNumber: change.range.startLineNumber,
        column: change.range.startColumn,
      });
      const end = model.getPositionAt(startOffset + change.text.length);
      const decorations = editor.createDecorationsCollection([
        {
          range: {
            startLineNumber: change.range.startLineNumber,
            startColumn: change.range.startColumn,
            endLineNumber: end.lineNumber,
            endColumn: end.column,
          },
          options: { className: "manual-guidance-inserted" },
        },
      ]);
      globalThis.window.setTimeout(() => decorations.clear(), 1000);
    });
    controller.insert(edit.text, {
      adjustWhitespace: false,
      undoStopBefore: true,
      undoStopAfter: true,
    });
    return;
  }

  const startOffset = model.getOffsetAt({
    lineNumber: edit.range.startLineNumber,
    column: edit.range.startColumn,
  });
  editor.executeEdits("manual-guidance", [
    {
      range: edit.range,
      text: resolveSnippetPlainText(edit.text),
      forceMoveMarkers: true,
    },
  ]);

  const selectionStart = model.getPositionAt(startOffset + edit.selectionStart);
  const selectionEnd = model.getPositionAt(startOffset + edit.selectionEnd);
  editor.setSelection({
    startLineNumber: selectionStart.lineNumber,
    startColumn: selectionStart.column,
    endLineNumber: selectionEnd.lineNumber,
    endColumn: selectionEnd.column,
  });
  editor.revealPositionInCenterIfOutsideViewport(selectionEnd);
}
