import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { resolveEditorContext } from "../../context/resolveEditorContext";
import { getContextualRecommendations } from "../../recommendations";
import { ContextualGuidance } from "../ContextualGuidance";

const messages = {
  analyzer: {
    manualGuidance: {
      context: {
        eyebrow: "Context",
        body: { title: "Build body" },
        unknown: { title: "Unknown", description: "Unknown context" },
      },
      tutorial: { return: "Back to tutorial" },
      recommendations: {
        assign: { title: "Add assignment", description: "Store a value" },
        if: { title: "Add IF", description: "Choose a path" },
        for: { title: "Add FOR", description: "Repeat" },
        while: { title: "Add WHILE", description: "Repeat while" },
      },
      families: { loop: "Loops", decision: "Decisions" },
    },
  },
};

describe("ContextualGuidance", () => {
  it("delegates a recommendation to the editor action contract", () => {
    const source = "suma(n) BEGIN\n";
    const context = resolveEditorContext({
      source,
      cursor: { line: 2, column: 0, offset: source.length },
      parseResult: { status: "invalid", errors: [] },
    });
    const recommendations = getContextualRecommendations(context, { limit: 4 });
    const actions = {
      insertSnippet: vi.fn(),
      insertSnippetAtCursor: vi.fn(),
      wrapSelection: vi.fn(),
      focusEditor: vi.fn(),
    };

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ContextualGuidance
          context={context}
          recommendations={recommendations}
          actions={actions}
          onAnalyze={vi.fn()}
          onTutorial={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Add assignment/i }));
    expect(actions.insertSnippetAtCursor).toHaveBeenCalledWith("assign");
  });
});
