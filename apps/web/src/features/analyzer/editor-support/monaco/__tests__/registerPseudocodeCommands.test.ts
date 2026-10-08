import type * as Monaco from "monaco-editor";

import {
  registerPseudocodeCommands,
  resolveBlockEnter,
} from "../registerPseudocodeCommands";

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
  KeyCode: { Tab: 2, RightArrow: 3, Enter: 4, Escape: 9 },
  KeyMod: { CtrlCmd: 2048, Shift: 1024 },
} as unknown as typeof Monaco;

describe("registerPseudocodeCommands", () => {
  it("accepts the ghost with Tab and applies the panel recommendation with Shift+Tab", () => {
    const editor = createEditor();
    const dismiss = vi.fn();
    const apply = vi.fn(() => true);

    registerPseudocodeCommands(
      editor as unknown as Monaco.editor.IStandaloneCodeEditor,
      monaco,
      undefined,
      { current: dismiss },
      { current: apply },
    );

    const commands = editor.addCommand.mock.calls.map((call) => ({
      key: call[0],
      when: call[2],
    }));

    expect(commands).toContainEqual({
      key: monaco.KeyCode.Tab,
      when: "inlineSuggestionVisible && !suggestWidgetVisible && !inSnippetMode",
    });
    expect(commands).toContainEqual({
      key: monaco.KeyMod.Shift | monaco.KeyCode.Tab,
      when: "!inSnippetMode && !suggestWidgetVisible",
    });
    expect(commands).not.toContainEqual(
      expect.objectContaining({ key: monaco.KeyCode.RightArrow }),
    );

    const shiftTab = editor.addCommand.mock.calls.find(
      (call) => call[0] === (monaco.KeyMod.Shift | monaco.KeyCode.Tab),
    );
    const shiftTabHandler = shiftTab?.[1] as () => void;
    shiftTabHandler();
    expect(apply).toHaveBeenCalledOnce();
    expect(editor.trigger).not.toHaveBeenCalledWith(
      "editor-support",
      "outdent",
      {},
    );
    expect(commands).toContainEqual({
      key: monaco.KeyCode.Enter,
      when: "!suggestWidgetVisible",
    });

    const escape = editor.addCommand.mock.calls.find(
      (call) => call[0] === monaco.KeyCode.Escape,
    );
    const escapeHandler = escape?.[1] as () => void;
    escapeHandler();
    expect(dismiss).toHaveBeenCalledOnce();
    expect(editor.trigger).toHaveBeenCalledWith(
      "editor-support",
      "editor.action.inlineSuggest.hide",
      {},
    );
  });
});

describe("resolveBlockEnter", () => {
  it("indents the body and closes BEGIN when Enter is pressed", () => {
    expect(resolveBlockEnter("hol(params) BEGIN", "")).toEqual({
      text: "\n  \nEND",
      cursorColumn: 3,
    });
  });

  it("keeps the surrounding indent and an existing END", () => {
    expect(resolveBlockEnter("  IF (n > 0) THEN BEGIN", "\n  END")).toEqual({
      text: "\n    ",
      cursorColumn: 5,
    });
  });

  it("does not insert another END when one already exists below", () => {
    expect(resolveBlockEnter("hol(params) BEGIN", "\n  x <- 1;\nEND")).toEqual({
      text: "\n  ",
      cursorColumn: 3,
    });
    expect(
      resolveBlockEnter("suma(n) BEGIN", "\n  IF (n > 0) THEN BEGIN\n  END"),
    ).toEqual({
      text: "\n  ",
      cursorColumn: 3,
    });
  });

  it("indents the next statement to the enclosing block", () => {
    expect(
      resolveBlockEnter("variable <- holas;", "", "suma(n) BEGIN\n"),
    ).toEqual({
      text: "\n  ",
      cursorColumn: 3,
    });
  });

  it("keeps a statement that is already indented", () => {
    expect(resolveBlockEnter("  x <- n;", "", "suma(n) BEGIN\n")).toEqual({
      text: "\n  ",
      cursorColumn: 3,
    });
  });

  it("outdents the line after END", () => {
    expect(
      resolveBlockEnter(
        "  END",
        "\nEND",
        "suma(n) BEGIN\n  IF (n > 0) THEN BEGIN\n    x <- 1;\n",
      ),
    ).toEqual({
      text: "\n  ",
      cursorColumn: 3,
    });
  });

  it("splits a line that still has text after the cursor", () => {
    expect(resolveBlockEnter("  x <- ", "n;")).toBeNull();
  });
});
