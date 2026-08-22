import {
  TUTORIAL_STEP_IDS,
  type ManualTutorialState,
  type TutorialStepId,
} from "./types";

export const MANUAL_TUTORIAL_VERSION = 2;

export function createInitialTutorialState(): ManualTutorialState {
  return {
    version: MANUAL_TUTORIAL_VERSION,
    status: "not_started",
    currentStepId: TUTORIAL_STEP_IDS[0],
    skippedSteps: [],
  };
}

function uniqueSteps(steps: readonly TutorialStepId[]): TutorialStepId[] {
  return TUTORIAL_STEP_IDS.filter((id) => steps.includes(id));
}

export function startTutorial(
  state: ManualTutorialState = createInitialTutorialState(),
): ManualTutorialState {
  return { ...state, status: "in_progress" };
}

export function nextTutorialStep(
  state: ManualTutorialState,
): ManualTutorialState {
  const index = TUTORIAL_STEP_IDS.indexOf(state.currentStepId);
  const next = TUTORIAL_STEP_IDS[index + 1];
  if (!next) return { ...state, status: "completed" };
  return { ...state, status: "in_progress", currentStepId: next };
}

export function previousTutorialStep(
  state: ManualTutorialState,
): ManualTutorialState {
  const index = TUTORIAL_STEP_IDS.indexOf(state.currentStepId);
  const previous = TUTORIAL_STEP_IDS[Math.max(0, index - 1)];
  return { ...state, status: "in_progress", currentStepId: previous };
}

export function skipCurrentTutorialStep(
  state: ManualTutorialState,
): ManualTutorialState {
  return nextTutorialStep({
    ...state,
    status: "in_progress",
    skippedSteps: uniqueSteps([...state.skippedSteps, state.currentStepId]),
  });
}

export function completeTutorial(
  state: ManualTutorialState,
): ManualTutorialState {
  return { ...state, status: "completed" };
}

export function skipTutorial(
  state: ManualTutorialState = createInitialTutorialState(),
): ManualTutorialState {
  return { ...state, status: "skipped" };
}

export function restartTutorial(): ManualTutorialState {
  return startTutorial(createInitialTutorialState());
}

export function setTutorialStep(
  state: ManualTutorialState,
  stepId: TutorialStepId,
): ManualTutorialState {
  return { ...state, status: "in_progress", currentStepId: stepId };
}
