import { MANUAL_TUTORIAL_VERSION, startTutorial } from "../tutorialState";
import {
  MANUAL_TUTORIAL_STORAGE_KEY,
  readTutorialState,
  writeTutorialState,
} from "../tutorialStorage";

describe("tutorialStorage", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips only versioned tutorial metadata", () => {
    const state = {
      ...startTutorial(),
      currentStepId: "PARAMETERS" as const,
      skippedSteps: ["HEADER" as const],
    };
    writeTutorialState(state);
    expect(
      JSON.parse(localStorage.getItem(MANUAL_TUTORIAL_STORAGE_KEY)!),
    ).toEqual({
      version: MANUAL_TUTORIAL_VERSION,
      status: "in_progress",
      currentStepId: "PARAMETERS",
      skippedSteps: ["HEADER"],
    });
    expect(readTutorialState()).toEqual(state);
  });

  it("resets malformed and old versions to the initial state", () => {
    localStorage.setItem(MANUAL_TUTORIAL_STORAGE_KEY, "{bad json");
    expect(readTutorialState().status).toBe("not_started");
    localStorage.setItem(
      MANUAL_TUTORIAL_STORAGE_KEY,
      JSON.stringify({
        version: 0,
        status: "completed",
        currentStepId: "REVIEW",
      }),
    );
    expect(readTutorialState().currentStepId).toBe("WELCOME");
  });
});
