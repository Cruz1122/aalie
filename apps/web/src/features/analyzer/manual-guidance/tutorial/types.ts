import type { EditorContext } from "../context/types";

export const TUTORIAL_STEP_IDS = [
  "WELCOME",
  "HEADER",
  "PARAMETERS",
  "FIRST_ACTION",
  "CONTROL_FLOW",
  "OUTPUT",
  "REVIEW",
] as const;

export type TutorialStepId = (typeof TUTORIAL_STEP_IDS)[number];
export type TutorialStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

export interface ManualTutorialState {
  readonly version: number;
  readonly status: TutorialStatus;
  readonly currentStepId: TutorialStepId;
  readonly skippedSteps: readonly TutorialStepId[];
}

export interface TutorialStep {
  readonly id: TutorialStepId;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly optional?: boolean;
  readonly illustration: string;
  readonly exampleKey: string;
  readonly snippetId?: string;
  readonly actionKey: string;
  readonly isSatisfied: (
    context: EditorContext,
    state: ManualTutorialState,
  ) => boolean;
}
