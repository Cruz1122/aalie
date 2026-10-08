import {
  MANUAL_TUTORIAL_VERSION,
  createInitialTutorialState,
} from "./tutorialState";
import {
  TUTORIAL_STEP_IDS,
  type ManualTutorialState,
  type TutorialStatus,
  type TutorialStepId,
} from "./types";

export const MANUAL_TUTORIAL_STORAGE_KEY = "aalie.manualTutorial";

function isStep(value: unknown): value is TutorialStepId {
  return (
    typeof value === "string" &&
    TUTORIAL_STEP_IDS.includes(value as TutorialStepId)
  );
}

function isStatus(value: unknown): value is TutorialStatus {
  return ["not_started", "in_progress", "completed", "skipped"].includes(
    value as string,
  );
}

export function readTutorialState(
  storage: Pick<Storage, "getItem"> | undefined = typeof window === "undefined"
    ? undefined
    : window.localStorage,
): ManualTutorialState {
  if (!storage) return createInitialTutorialState();
  try {
    const raw = storage.getItem(MANUAL_TUTORIAL_STORAGE_KEY);
    if (!raw) return createInitialTutorialState();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object")
      return createInitialTutorialState();
    const value = parsed as Partial<ManualTutorialState>;
    if (
      value.version !== MANUAL_TUTORIAL_VERSION ||
      !isStatus(value.status) ||
      !isStep(value.currentStepId)
    ) {
      return createInitialTutorialState();
    }
    const skippedSteps = Array.isArray(value.skippedSteps)
      ? value.skippedSteps.filter(isStep)
      : [];
    return {
      version: MANUAL_TUTORIAL_VERSION,
      status: value.status,
      currentStepId: value.currentStepId,
      skippedSteps: [...new Set(skippedSteps)],
    };
  } catch {
    return createInitialTutorialState();
  }
}

export function writeTutorialState(
  state: ManualTutorialState,
  storage: Pick<Storage, "setItem"> | undefined = typeof window === "undefined"
    ? undefined
    : window.localStorage,
): void {
  if (!storage) return;
  storage.setItem(
    MANUAL_TUTORIAL_STORAGE_KEY,
    JSON.stringify({
      version: MANUAL_TUTORIAL_VERSION,
      status: state.status,
      currentStepId: state.currentStepId,
      skippedSteps: [...state.skippedSteps],
    }),
  );
}
