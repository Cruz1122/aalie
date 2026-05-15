import type { MutableRefObject } from "react";
import type * as Monaco from "monaco-editor";

export function registerPseudocodeCommands(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco,
  onAnalyzeRef?: MutableRefObject<(() => void) | undefined>,
) {
  editor.addCommand(monaco.KeyCode.Tab, () => {
    const suggestState = editor.getContribution(
      "editor.contrib.suggestController",
    ) as {
      model?: { state?: number };
      widget?: { value?: { isExpanded?: boolean } };
    } | null;

    const inlineController = editor.getContribution(
      "editor.contrib.inlineCompletionsController",
    ) as {
      model?: { state?: { ghostText?: unknown } };
      commitCurrentSuggestion?: () => void;
    } | null;

    if (
      inlineController?.model?.state?.ghostText &&
      inlineController.commitCurrentSuggestion
    ) {
      inlineController.commitCurrentSuggestion();
      return;
    }

    if ((suggestState?.model?.state ?? 0) > 0) {
      editor.trigger("editor-support", "acceptSelectedSuggestion", {});
      return;
    }

    editor.trigger("editor-support", "tab", {});
  });

  editor.addCommand(monaco.KeyCode.RightArrow, () => {
    const inlineController = editor.getContribution(
      "editor.contrib.inlineCompletionsController",
    ) as {
      model?: { state?: { ghostText?: unknown } };
      commitCurrentSuggestion?: () => void;
    } | null;

    if (
      inlineController?.model?.state?.ghostText &&
      inlineController.commitCurrentSuggestion
    ) {
      inlineController.commitCurrentSuggestion();
      return;
    }

    editor.trigger("editor-support", "cursorRight", {});
  });

  // Ctrl+Enter (or Cmd+Enter on Mac) to trigger analysis
  if (onAnalyzeRef) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onAnalyzeRef.current?.();
    });
  }
}
