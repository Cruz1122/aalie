import type * as Monaco from "monaco-editor";

import { registerPseudocodeCommands } from "../registerPseudocodeCommands";

type FakeEditor = {
  addCommand: ReturnType<typeof vi.fn>;
  getContribution: ReturnType<typeof vi.fn>;
  trigger: ReturnType<typeof vi.fn>;
};

function createEditor(): FakeEditor {
  return {
    addCommand: vi.fn(),
    getContribution: vi.fn(),
    trigger: vi.fn(),
  };
}

const monaco = {
  KeyCode: { Tab: 2, RightArrow: 3, Enter: 4 },
  KeyMod: { CtrlCmd: 2048 },
} as unknown as typeof Monaco;

describe("registerPseudocodeCommands", () => {
  it("commits Monaco ghost text through the public inline command", () => {
    const editor = createEditor();
    editor.getContribution.mockReturnValue({
      model: {
        get: () => ({ primaryGhostText: { get: () => ({ line: 1 }) } }),
      },
    });

    registerPseudocodeCommands(
      editor as unknown as Monaco.editor.IStandaloneCodeEditor,
      monaco,
      undefined,
    );

    const tabHandler = editor.addCommand.mock.calls[0]?.[1] as () => void;
    tabHandler();

    expect(editor.trigger).toHaveBeenCalledWith(
      "editor-support",
      "editor.action.inlineSuggest.commit",
      {},
    );
  });

  it("keeps Monaco inline completion behavior when no recommendation handles Tab", () => {
    const editor = createEditor();
    const commitCurrentSuggestion = vi.fn();
    editor.getContribution.mockReturnValue({
      model: { state: { ghostText: { line: 1 } } },
      commitCurrentSuggestion,
    });

    registerPseudocodeCommands(
      editor as unknown as Monaco.editor.IStandaloneCodeEditor,
      monaco,
      undefined,
    );

    const tabHandler = editor.addCommand.mock.calls[0]?.[1] as () => void;
    tabHandler();

    expect(commitCurrentSuggestion).toHaveBeenCalledOnce();
  });

  it("accepts Monaco's selected completion before the contextual ghost", () => {
    const editor = createEditor();
    editor.getContribution.mockImplementation((id: string) => {
      if (id === "editor.contrib.suggestController") {
        return { widget: { value: { state: 3 } } };
      }
      if (id === "editor.contrib.inlineCompletionsController") {
        return {
          model: {
            get: () => ({ primaryGhostText: { get: () => ({ line: 1 }) } }),
          },
          commitCurrentSuggestion: vi.fn(),
        };
      }
      return null;
    });

    registerPseudocodeCommands(
      editor as unknown as Monaco.editor.IStandaloneCodeEditor,
      monaco,
      undefined,
    );

    const tabHandler = editor.addCommand.mock.calls[0]?.[1] as () => void;
    tabHandler();

    expect(editor.trigger).toHaveBeenCalledWith(
      "editor-support",
      "acceptSelectedSuggestion",
      {},
    );
  });

  it("moves to the next Monaco snippet placeholder before accepting a ghost", () => {
    const editor = createEditor();
    editor.getContribution.mockImplementation((id: string) => {
      if (id === "snippetController2") {
        return { isInSnippet: () => true };
      }
      if (id === "editor.contrib.inlineCompletionsController") {
        return {
          model: {
            get: () => ({ primaryGhostText: { get: () => ({ line: 1 }) } }),
          },
        };
      }
      return null;
    });

    registerPseudocodeCommands(
      editor as unknown as Monaco.editor.IStandaloneCodeEditor,
      monaco,
      undefined,
    );

    const tabHandler = editor.addCommand.mock.calls[0]?.[1] as () => void;
    tabHandler();

    expect(editor.trigger).toHaveBeenCalledWith(
      "editor-support",
      "jumpToNextSnippetPlaceholder",
      {},
    );
  });
});
