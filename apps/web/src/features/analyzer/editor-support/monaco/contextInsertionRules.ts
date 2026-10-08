import type * as Monaco from "monaco-editor";

import {
  localizeSnippet,
  type LocalizedSnippetDefinition,
  type SnippetDefinition,
} from "../catalog/snippetCatalog";

function indentBlock(text: string, indent = "  "): string {
  return text
    .split("\n")
    .map((line) => (line.trim() ? `${indent}${line}` : line))
    .join("\n");
}

function stripSharedIndent(text: string): string {
  const lines = text.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  if (nonEmptyLines.length === 0) {
    return text;
  }

  const sharedIndent = Math.min(
    ...nonEmptyLines.map((line) => (line.match(/^[ \t]*/) ?? [""])[0].length),
  );

  if (sharedIndent === 0) {
    return text;
  }

  return lines.map((line) => line.slice(sharedIndent)).join("\n");
}

export function applyContextIndentation(
  text: string,
  baseIndent: string,
): string {
  if (!baseIndent) {
    return text;
  }

  const lines = text.split("\n");
  if (lines.length <= 1) {
    return text;
  }

  return [
    lines[0],
    ...lines.slice(1).map((line) => `${baseIndent}${line}`),
  ].join("\n");
}

export function buildSnippetInsertionText(
  snippet: LocalizedSnippetDefinition,
  selectedText: string,
): string {
  const normalizedSelectedText = stripSharedIndent(selectedText);

  if (!snippet.supportsSelectionWrap || !normalizedSelectedText.trim()) {
    return snippet.insertText;
  }

  const bodyPlaceholderById: Partial<Record<string, number>> = {
    "begin-end": 1,
    if: 2,
    "if-else": 2,
    while: 2,
    for: 4,
  };
  const bodyPlaceholderIndex = bodyPlaceholderById[snippet.id];

  if (!bodyPlaceholderIndex) {
    return snippet.insertText;
  }

  const bodyPlaceholderPattern = new RegExp(
    `(^|\\n)([ \\t]*)\\$\\{${bodyPlaceholderIndex}(?::[^}]*)?\\}`,
    "m",
  );

  return snippet.insertText.replace(
    bodyPlaceholderPattern,
    (_, lineStart: string, indent: string) =>
      `${lineStart}${indentBlock(normalizedSelectedText, indent || "  ")}`,
  );
}

export function resolveSnippetPlainText(snippetText: string): string {
  return snippetText
    .replace(/\$\{\d+:([^}]+)\}/g, "$1")
    .replace(/\$\{\d+\}/g, "")
    .replace(/\$(\d+)/g, "");
}

const selectedPlaceholderBySnippetId: Partial<Record<string, number>> = {
  assign: 1,
  call: 1,
  "return-value": 1,
  if: 1,
  "if-else": 1,
  while: 1,
  for: 1,
  "repeat-until": 2,
  "algorithm-header": 2,
};

function indexOfPlaceholder(text: string, value: string): number {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(
    `(?:^|[^A-Za-z0-9_])(${escaped})(?![A-Za-z0-9_])`,
    "u",
  ).exec(text);
  if (!match?.[1]) return -1;
  return match.index + match[0].length - value.length;
}

export function getSnippetSelectionOffsets(
  snippet: LocalizedSnippetDefinition,
  insertionText: string,
): { start: number; end: number } | null {
  const placeholderIndex = selectedPlaceholderBySnippetId[snippet.id];
  if (!placeholderIndex) return null;

  const placeholderPattern = new RegExp(
    "\\$\\{" + placeholderIndex + "(?::([^}]*))?\\}",
  );
  const placeholderMatch = placeholderPattern.exec(snippet.insertText);
  const defaultValue = placeholderMatch?.[1];
  if (!defaultValue) return null;

  const escapedDefaultValue = defaultValue.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  const semanticPrefixBySnippetId: Partial<Record<string, string>> = {
    if: "IF\\s*\\(\\s*",
    "if-else": "IF\\s*\\(\\s*",
    while: "WHILE\\s*\\(\\s*",
    "repeat-until": "UNTIL\\s*\\(\\s*",
  };
  const semanticPrefix = semanticPrefixBySnippetId[snippet.id];
  const semanticMatch = semanticPrefix
    ? new RegExp(semanticPrefix + escapedDefaultValue, "i").exec(insertionText)
    : null;
  const start = semanticMatch
    ? semanticMatch.index + semanticMatch[0].length - defaultValue.length
    : indexOfPlaceholder(insertionText, defaultValue);
  if (start < 0) return null;

  return { start, end: start + defaultValue.length };
}

interface SnippetSelection {
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber: number;
  readonly endColumn: number;
  readonly positionLineNumber: number;
  readonly positionColumn: number;
}

interface PreparedSnippetInsertion {
  readonly targetRange: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  readonly insertionText: string;
  readonly startOffset: number;
  readonly rangeStartOffset: number;
  readonly rangeEndOffset: number;
}

export function prepareSnippetInsertion(
  model: Monaco.editor.ITextModel,
  snippet: SnippetDefinition,
  localizedSnippet: LocalizedSnippetDefinition,
  selection: SnippetSelection,
): PreparedSnippetInsertion {
  const position = {
    lineNumber: selection.positionLineNumber,
    column: selection.positionColumn,
  };
  let targetRange = {
    startLineNumber: selection.startLineNumber,
    startColumn: selection.startColumn,
    endLineNumber: selection.endLineNumber,
    endColumn: selection.endColumn,
  };
  let selectedText = model.getValueInRange(targetRange);
  if (snippet.id === "return-value" && selectedText.trim()) {
    targetRange = {
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    };
    selectedText = "";
  }

  const snippetText = buildSnippetInsertionText(localizedSnippet, selectedText);
  const startLinePrefix = model
    .getLineContent(targetRange.startLineNumber)
    .slice(0, Math.max(0, targetRange.startColumn - 1));
  const baseIndent = /^\s*$/.test(startLinePrefix) ? startLinePrefix : "";
  let insertionText = applyContextIndentation(snippetText, baseIndent);
  let startOffset = model.getOffsetAt({
    lineNumber: targetRange.startLineNumber,
    column: targetRange.startColumn,
  });

  const isLineBasedSnippet =
    snippet.insertKind === "block" ||
    snippet.contextRules.includes("lineStart");
  if (!selectedText.trim() && isLineBasedSnippet) {
    const lineNumber = targetRange.startLineNumber;
    const lineContent = model.getLineContent(lineNumber);
    const cursorIndex = Math.max(0, targetRange.startColumn - 1);
    const linePrefix = lineContent.slice(0, cursorIndex);
    const lineSuffix = lineContent.slice(cursorIndex);
    const lineIndent = lineContent.match(/^[ \t]*/)?.[0] ?? "";
    const plainSnippet = snippetText;
    const lineStartOffset = model.getOffsetAt({
      lineNumber,
      column: 1,
    });
    const cursorOffset = model.getOffsetAt({
      lineNumber,
      column: targetRange.startColumn,
    });

    if (linePrefix.trim()) {
      insertionText =
        lineIndent + applyContextIndentation(plainSnippet, lineIndent);
      insertionText = `\n${insertionText}`;
      if (lineSuffix.trim()) insertionText += `\n${lineIndent}`;
    } else {
      targetRange = {
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: targetRange.startColumn,
      };
      startOffset = lineStartOffset;

      if (/^END\b/i.test(lineSuffix.trim())) {
        insertionText =
          indentBlock(plainSnippet, `${lineIndent}  `) + `\n${lineIndent}`;
      } else {
        insertionText = indentBlock(plainSnippet, lineIndent);
        if (lineSuffix.trim()) insertionText += `\n${lineIndent}`;
      }
    }

    if (linePrefix.trim()) {
      startOffset = cursorOffset;
    }
  }

  return {
    targetRange,
    insertionText,
    startOffset,
    rangeStartOffset: model.getOffsetAt({
      lineNumber: targetRange.startLineNumber,
      column: targetRange.startColumn,
    }),
    rangeEndOffset: model.getOffsetAt({
      lineNumber: targetRange.endLineNumber,
      column: targetRange.endColumn,
    }),
  };
}

interface SnippetController {
  insert?: (
    template: string,
    options?: {
      readonly adjustWhitespace?: boolean;
      readonly undoStopBefore?: boolean;
      readonly undoStopAfter?: boolean;
    },
  ) => void;
}

function flashInsertedText(editor: Monaco.editor.IStandaloneCodeEditor) {
  const disposable = editor.onDidChangeModelContent((event) => {
    disposable.dispose();
    const change = event.changes[0];
    const model = editor.getModel();
    if (!change || !model) return;

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
}

function insertPreparedSnippets(
  editor: Monaco.editor.IStandaloneCodeEditor,
  prepared: readonly PreparedSnippetInsertion[],
) {
  const model = editor.getModel();
  if (!model || prepared.length === 0) return;

  const controller = editor.getContribution(
    "snippetController2",
  ) as SnippetController | null;
  editor.focus();
  flashInsertedText(editor);

  const sharedTemplate = prepared.every(
    (insertion) => insertion.insertionText === prepared[0]?.insertionText,
  );
  if (controller?.insert && sharedTemplate) {
    editor.setSelections(
      prepared.map((insertion) => ({
        selectionStartLineNumber: insertion.targetRange.startLineNumber,
        selectionStartColumn: insertion.targetRange.startColumn,
        positionLineNumber: insertion.targetRange.endLineNumber,
        positionColumn: insertion.targetRange.endColumn,
      })),
    );
    controller.insert(prepared[0]!.insertionText, {
      adjustWhitespace: false,
      undoStopBefore: true,
      undoStopAfter: true,
    });
    const end = editor.getPosition();
    if (end) editor.revealPositionInCenterIfOutsideViewport(end);
    return;
  }

  if (controller?.insert && prepared.length > 1) {
    const primary = prepared[0]!;
    const others = prepared.slice(1);
    editor.executeEdits(
      "editor-support",
      others.map((insertion) => ({
        range: insertion.targetRange,
        text: resolveSnippetPlainText(insertion.insertionText),
        forceMoveMarkers: true,
      })),
    );
    editor.setSelection(primary.targetRange);
    controller.insert(primary.insertionText, {
      adjustWhitespace: false,
      undoStopBefore: false,
      undoStopAfter: true,
    });
    return;
  }

  editor.executeEdits(
    "editor-support",
    prepared.map((insertion) => ({
      range: insertion.targetRange,
      text: resolveSnippetPlainText(insertion.insertionText),
      forceMoveMarkers: true,
    })),
  );
}

export function insertSnippetIntoEditor(
  editor: Monaco.editor.IStandaloneCodeEditor,
  snippet: SnippetDefinition,
  locale = "es",
  insertTextOverride?: string,
) {
  const model = editor.getModel();
  if (!model) return;

  const localizedSnippet = localizeSnippet(snippet, locale);
  const insertionSnippet = insertTextOverride
    ? { ...localizedSnippet, insertText: insertTextOverride }
    : localizedSnippet;
  const rawSelections = editor.getSelections() ?? [];
  const fallbackPosition = editor.getPosition() ?? {
    lineNumber: 1,
    column: 1,
  };
  const selections: SnippetSelection[] =
    rawSelections.length > 0
      ? rawSelections.map((selection) => ({
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
          positionLineNumber: selection.positionLineNumber,
          positionColumn: selection.positionColumn,
        }))
      : [
          {
            startLineNumber: fallbackPosition.lineNumber,
            startColumn: fallbackPosition.column,
            endLineNumber: fallbackPosition.lineNumber,
            endColumn: fallbackPosition.column,
            positionLineNumber: fallbackPosition.lineNumber,
            positionColumn: fallbackPosition.column,
          },
        ];
  const prepared = selections.map((selection) =>
    prepareSnippetInsertion(model, snippet, insertionSnippet, selection),
  );

  insertPreparedSnippets(editor, prepared);
}
