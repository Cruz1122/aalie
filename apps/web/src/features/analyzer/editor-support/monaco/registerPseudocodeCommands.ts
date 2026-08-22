import type * as Monaco from "monaco-editor";
import type { MutableRefObject } from "react";

function hasRenderableGhostText(value: unknown): boolean {
  if (!value) return false;
  if (
    typeof value === "object" &&
    "isEmpty" in value &&
    typeof value.isEmpty === "function"
  ) {
    return !value.isEmpty();
  }
  return true;
}

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
      widget?: { value?: { state?: number; isExpanded?: boolean } };
    } | null;

    // The native completion widget must win over the contextual ghost. This
    // prevents Tab from inserting a panel recommendation when Monaco has a
    // concrete completion selected for the same cursor position.
    const suggestWidgetState = suggestState?.widget?.value?.state ?? 0;
    if (suggestWidgetState >= 3) {
      editor.trigger("editor-support", "acceptSelectedSuggestion", {});
      return;
    }

    const snippetController = editor.getContribution("snippetController2") as {
      isInSnippet?: () => boolean;
    } | null;

    // A snippet placeholder is a real editing session in Monaco. Let it own
    // Tab so parameter navigation never gets swallowed by the ghost command.
    if (snippetController?.isInSnippet?.()) {
      editor.trigger(
        "editor-support",
        "jumpToNextSnippetPlaceholder",
        {},
      );
      return;
    }

    const inlineController = editor.getContribution(
      "editor.contrib.inlineCompletionsController",
    ) as {
      model?: {
        get?: () => {
          state?: { ghostText?: unknown };
          primaryGhostText?: { get?: () => unknown };
        };
        state?: { ghostText?: unknown };
        primaryGhostText?: { get?: () => unknown };
      };
      commitCurrentSuggestion?: () => void;
    } | null;

    const inlineModel =
      inlineController?.model?.get?.() ?? inlineController?.model;
    const ghostText =
      inlineModel?.primaryGhostText?.get?.() ?? inlineModel?.state?.ghostText;
    if (hasRenderableGhostText(ghostText)) {
      if (inlineController.commitCurrentSuggestion) {
        inlineController.commitCurrentSuggestion();
      } else {
        editor.trigger("editor-support", "editor.action.inlineSuggest.commit", {});
      }
      return;
    }

    editor.trigger("editor-support", "tab", {});
  });

  editor.addCommand(monaco.KeyCode.RightArrow, () => {
    const inlineController = editor.getContribution(
      "editor.contrib.inlineCompletionsController",
    ) as {
      model?: {
        get?: () => {
          state?: { ghostText?: unknown };
          primaryGhostText?: { get?: () => unknown };
        };
        state?: { ghostText?: unknown };
        primaryGhostText?: { get?: () => unknown };
      };
      commitCurrentSuggestion?: () => void;
    } | null;

    const inlineModel =
      inlineController?.model?.get?.() ?? inlineController?.model;
    const ghostText =
      inlineModel?.primaryGhostText?.get?.() ?? inlineModel?.state?.ghostText;
    if (hasRenderableGhostText(ghostText)) {
      if (inlineController.commitCurrentSuggestion) {
        inlineController.commitCurrentSuggestion();
      } else {
        editor.trigger("editor-support", "editor.action.inlineSuggest.commit", {});
      }
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
