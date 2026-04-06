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

export function insertSnippetIntoEditor(
  editor: Monaco.editor.IStandaloneCodeEditor,
  snippet: SnippetDefinition,
  locale = "es",
) {
  const model = editor.getModel();
  if (!model) return;

  const selection = editor.getSelection();
  const position = editor.getPosition();
  const targetRange = selection ?? {
    startLineNumber: position?.lineNumber ?? 1,
    startColumn: position?.column ?? 1,
    endLineNumber: position?.lineNumber ?? 1,
    endColumn: position?.column ?? 1,
  };
  const selectedText = model.getValueInRange(targetRange);
  const localizedSnippet = localizeSnippet(snippet, locale);
  const snippetText = buildSnippetInsertionText(localizedSnippet, selectedText);
  const startLinePrefix = model
    .getLineContent(targetRange.startLineNumber)
    .slice(0, Math.max(0, targetRange.startColumn - 1));
  const baseIndent = /^\s*$/.test(startLinePrefix) ? startLinePrefix : "";
  const insertionText = applyContextIndentation(
    resolveSnippetPlainText(snippetText),
    baseIndent,
  );
  const startOffset = model.getOffsetAt({
    lineNumber: targetRange.startLineNumber,
    column: targetRange.startColumn,
  });

  editor.focus();
  editor.executeEdits("editor-support", [
    {
      range: targetRange,
      text: insertionText,
      forceMoveMarkers: true,
    },
  ]);

  const endPosition = model.getPositionAt(startOffset + insertionText.length);
  editor.setPosition(endPosition);
  editor.setSelection({
    startLineNumber: endPosition.lineNumber,
    startColumn: endPosition.column,
    endLineNumber: endPosition.lineNumber,
    endColumn: endPosition.column,
  });
  editor.revealPositionInCenterIfOutsideViewport(endPosition);
}
