import {
  createInitialTutorialState,
  nextTutorialStep,
  previousTutorialStep,
  skipCurrentTutorialStep,
  startTutorial,
} from "../tutorialState";

describe("tutorialState", () => {
  it("advances from welcome through the six tutorial steps and completes", () => {
    let state = startTutorial();
    expect(state.currentStepId).toBe("WELCOME");
    for (let index = 0; index < 7; index += 1) state = nextTutorialStep(state);
    expect(state.status).toBe("completed");
    expect(state.currentStepId).toBe("REVIEW");
  });

  it("persists an explicit skipped step and does not mutate prior state", () => {
    const initial = startTutorial();
    const skipped = skipCurrentTutorialStep(initial);
    expect(initial.skippedSteps).toEqual([]);
    expect(skipped.skippedSteps).toEqual(["WELCOME"]);
    expect(skipped.currentStepId).toBe("HEADER");
  });

  it("does not move before the first step", () => {
    const state = previousTutorialStep(createInitialTutorialState());
    expect(state.currentStepId).toBe("WELCOME");
    expect(state.status).toBe("in_progress");
  });
});
