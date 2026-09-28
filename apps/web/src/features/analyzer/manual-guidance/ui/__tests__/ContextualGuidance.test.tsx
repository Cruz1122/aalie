import { render, screen } from "@testing-library/react";
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
      tutorial: {
        return: "Back to tutorial",
        progress: "Step {current} of {total}",
      },
      actions: {
        analyze: "Analyze",
        applyWithTabBefore: "Press",
        applyWithTabAfter: "to apply",
      },
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
    const onActiveRecommendationChange = vi.fn();

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ContextualGuidance
          context={context}
          recommendations={recommendations}
          onAnalyze={vi.fn()}
          onTutorial={vi.fn()}
          onActiveRecommendationChange={onActiveRecommendationChange}
        />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getAllByRole("button", { name: /Press Shift\+Tab to apply/i })
        .length,
    ).toBeGreaterThan(0);
    expect(onActiveRecommendationChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: "assign" }),
    );
  });
});
