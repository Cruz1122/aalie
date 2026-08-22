import { resolveEditorContext } from "../../context/resolveEditorContext";
import { startTutorial } from "../tutorialState";
import { getTutorialStep } from "../tutorialSteps";

function context(source: string) {
  return resolveEditorContext({
    source,
    cursor: { line: 1, column: source.length, offset: source.length },
    parseResult: { status: "invalid", errors: [] },
  });
}

describe("tutorialSteps", () => {
  it("uses the tutorial namespace used by both locale message trees", () => {
    const step = getTutorialStep("HEADER");
    expect(step.titleKey).toBe("tutorial.steps.header.title");
    expect(step.descriptionKey).toBe("tutorial.steps.header.description");
  });

  it("requires an explicit no-parameters decision", () => {
    const step = getTutorialStep("PARAMETERS");
    const state = startTutorial({
      currentStepId: "PARAMETERS",
      status: "in_progress",
      skippedSteps: [],
      version: 1,
    });
    expect(step.isSatisfied(context("buscar() BEGIN\nEND"), state)).toBe(false);
    expect(
      step.isSatisfied(context("buscar() BEGIN\nEND"), {
        ...state,
        skippedSteps: ["PARAMETERS"],
      }),
    ).toBe(true);
  });

  it("detects control flow and output from the pure context", () => {
    const source =
      "buscar(n) BEGIN\nIF (n > 0) THEN BEGIN\nRETURN n;\nEND\nEND";
    const resolved = context(source);
    expect(
      getTutorialStep("CONTROL_FLOW").isSatisfied(resolved, startTutorial()),
    ).toBe(true);
    expect(
      getTutorialStep("OUTPUT").isSatisfied(resolved, startTutorial()),
    ).toBe(true);
  });
});
