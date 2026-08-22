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
};

function getSnippetSelectionOffsets(
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
    ? new RegExp(semanticPrefix + escapedDefaultValue, "i").exec(
        insertionText,
      )
    : null;
  const start = semanticMatch
    ? semanticMatch.index + semanticMatch[0].length - defaultValue.length
    : insertionText.indexOf(defaultValue);
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

function prepareSnippetInsertion(
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
  let insertionText = applyContextIndentation(
    resolveSnippetPlainText(snippetText),
    baseIndent,
  );
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
    const plainSnippet = resolveSnippetPlainText(snippetText);
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
          indentBlock(plainSnippet, `${lineIndent}  `) +
          `\n${lineIndent}`;
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

  editor.focus();
  editor.executeEdits(
    "editor-support",
    prepared.map((insertion) => ({
      range: insertion.targetRange,
      text: insertion.insertionText,
      forceMoveMarkers: true,
    })),
  );

  const procedureName =
    snippet.id === "algorithm-header"
      ? insertionSnippet.insertText.match(/^\$\{1:([^}]+)\}/)?.[1]
      : undefined;
  const finalSelections = prepared.map((insertion, index) => {
    const placeholderOffsets = procedureName
      ? null
      : getSnippetSelectionOffsets(insertionSnippet, insertion.insertionText);
    const relativeStart = procedureName
      ? insertion.insertionText.startsWith(procedureName)
        ? 0
        : insertion.insertionText.length
      : placeholderOffsets?.start ?? insertion.insertionText.length;
    const relativeEnd = procedureName
      ? insertion.insertionText.startsWith(procedureName)
        ? procedureName.length
        : insertion.insertionText.length
      : placeholderOffsets?.end ?? insertion.insertionText.length;
    const originalStart = insertion.startOffset + relativeStart;
    const originalEnd = insertion.startOffset + relativeEnd;
    const shiftBefore = (originalOffset: number) =>
      prepared.reduce((shift, other, otherIndex) => {
        if (otherIndex === index) return shift;
        const otherStart = other.rangeStartOffset;
        if (otherStart >= originalOffset) return shift;
        return (
          shift +
          other.insertionText.length -
          (other.rangeEndOffset - other.rangeStartOffset)
        );
      }, 0);
    const finalStart = model.getPositionAt(
      originalStart + shiftBefore(originalStart),
    );
    const finalEnd = model.getPositionAt(
      originalEnd + shiftBefore(originalEnd),
    );
    return {
      selectionStartLineNumber: finalStart.lineNumber,
      selectionStartColumn: finalStart.column,
      positionLineNumber: finalEnd.lineNumber,
      positionColumn: finalEnd.column,
    };
  });

  editor.setSelections(finalSelections);
  const lastSelection = finalSelections[finalSelections.length - 1];
  if (lastSelection) {
    editor.revealPositionInCenterIfOutsideViewport({
      lineNumber: lastSelection.positionLineNumber,
      column: lastSelection.positionColumn,
    });
  }
}
