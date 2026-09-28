import type * as Monaco from "monaco-editor";
import type { MutableRefObject } from "react";

function lineEndsWithBegin(beforeCursor: string): string | null {
  const match = /^([ \t]*)(.*\bBEGIN)\s*$/i.exec(beforeCursor);
  return match ? (match[1] ?? "") : null;
}

function blockDepth(source: string): number {
  let depth = 0;
  for (const match of source.matchAll(/\bBEGIN\b|\bEND\b/gi)) {
    if (match[0].toUpperCase() === "BEGIN") depth += 1;
    else depth = Math.max(0, depth - 1);
  }
  return depth;
}

function statementIndent(textBeforeLine: string, linePrefix: string): string {
  const current = /^[ \t]*/u.exec(linePrefix)?.[0] ?? "";
  const trimmed = linePrefix.trim();
  const depth = blockDepth(textBeforeLine);
  const structuralDepth = /^END\b/i.test(trimmed)
    ? Math.max(0, depth - 1)
    : depth;
  const structural = "  ".repeat(structuralDepth);
  if (/^END\b/i.test(trimmed)) return structural;
  return current.length > structural.length ? current : structural;
}

export function resolveBlockEnter(
  beforeCursor: string,
  textAfterCursor: string,
  textBeforeLine = "",
): { readonly text: string; readonly cursorColumn: number } | null {
  const restOfLine = textAfterCursor.split(/\r?\n/u, 1)[0] ?? "";
  if (restOfLine.trim()) return null;

  const indent = lineEndsWithBegin(beforeCursor);
  if (indent !== null) {
    const bodyIndent = `${indent}  `;
    const alreadyClosed = /\bEND\b/i.test(textAfterCursor);
    return {
      text: alreadyClosed ? `\n${bodyIndent}` : `\n${bodyIndent}\n${indent}END`,
      cursorColumn: bodyIndent.length + 1,
    };
  }

  const nextIndent = statementIndent(textBeforeLine, beforeCursor);
  return {
    text: `\n${nextIndent}`,
    cursorColumn: nextIndent.length + 1,
  };
}

export function registerPseudocodeCommands(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco,
  onAnalyzeRef?: MutableRefObject<(() => void) | undefined>,
  onDismissInlineSuggestionRef?: MutableRefObject<(() => void) | undefined>,
  applyRecommendationRef?: MutableRefObject<(() => boolean) | undefined>,
) {
  // Weight of dynamic commands is higher than Monaco's built-in Tab handler,
  // so this only claims Tab while a ghost is actually visible. Suggest widgets
  // and snippet placeholders keep the native Tab behavior.
  editor.addCommand(
    monaco.KeyCode.Tab,
    () => {
      editor.trigger(
        "editor-support",
        "editor.action.inlineSuggest.commit",
        {},
      );
    },
    "inlineSuggestionVisible && !suggestWidgetVisible && !inSnippetMode",
  );

  editor.addCommand(
    monaco.KeyMod.Shift | monaco.KeyCode.Tab,
    () => {
      if (applyRecommendationRef?.current?.()) return;
      editor.trigger("editor-support", "outdent", {});
    },
    "!inSnippetMode && !suggestWidgetVisible",
  );

  editor.addCommand(
    monaco.KeyCode.Escape,
    () => {
      onDismissInlineSuggestionRef?.current?.();
      editor.trigger("editor-support", "editor.action.inlineSuggest.hide", {});
    },
    "inlineSuggestionVisible && !suggestWidgetVisible",
  );

  editor.addCommand(
    monaco.KeyCode.Enter,
    () => {
      editor.trigger("editor-support", "editor.action.inlineSuggest.hide", {});

      const model = editor.getModel();
      const position = editor.getPosition();
      const selection = editor.getSelection();
      if (
        !model ||
        !position ||
        (selection &&
          (selection.startLineNumber !== selection.endLineNumber ||
            selection.startColumn !== selection.endColumn))
      ) {
        editor.trigger("editor-support", "type", { text: "\n" });
        return;
      }

      const line = model.getLineContent(position.lineNumber);
      const offset = model.getOffsetAt(position);
      const lineStart = model.getOffsetAt({
        lineNumber: position.lineNumber,
        column: 1,
      });
      const insertion = resolveBlockEnter(
        line.slice(0, position.column - 1),
        model.getValue().slice(offset),
        model.getValue().slice(0, lineStart),
      );
      if (!insertion) {
        editor.trigger("editor-support", "type", { text: "\n" });
        return;
      }

      editor.executeEdits("editor-support", [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: insertion.text,
          forceMoveMarkers: true,
        },
      ]);
      const cursor = {
        lineNumber: position.lineNumber + 1,
        column: insertion.cursorColumn,
      };
      editor.setPosition(cursor);
      editor.setSelection({
        startLineNumber: cursor.lineNumber,
        startColumn: cursor.column,
        endLineNumber: cursor.lineNumber,
        endColumn: cursor.column,
      });
    },
    "!suggestWidgetVisible",
  );

  if (onAnalyzeRef) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onAnalyzeRef.current?.();
    });
  }
}
