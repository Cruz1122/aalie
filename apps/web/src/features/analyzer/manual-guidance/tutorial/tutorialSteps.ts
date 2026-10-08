import {
  TUTORIAL_STEP_IDS,
  type ManualTutorialState,
  type TutorialStep,
} from "./types";

function skipped(
  id: (typeof TUTORIAL_STEP_IDS)[number],
  state: ManualTutorialState,
) {
  return state.skippedSteps.includes(id);
}

export const tutorialSteps: readonly TutorialStep[] = [
  {
    id: "WELCOME",
    titleKey: "welcome.title",
    descriptionKey: "welcome.description",
    illustration: "waving_hand",
    exampleKey: "welcome.description",
    actionKey: "tutorial.next",
    isSatisfied: () => true,
  },
  {
    id: "HEADER",
    titleKey: "tutorial.steps.header.title",
    descriptionKey: "tutorial.steps.header.description",
    illustration: "function",
    exampleKey: "tutorial.examples.header",
    snippetId: "algorithm-header",
    actionKey: "actions.insert",
    isSatisfied: (context) => context.structure.hasProcedure,
  },
  {
    id: "PARAMETERS",
    titleKey: "tutorial.steps.parameters.title",
    descriptionKey: "tutorial.steps.parameters.description",
    optional: true,
    illustration: "tune",
    exampleKey: "tutorial.examples.parameters",
    actionKey: "actions.insert",
    isSatisfied: (context, state) =>
      context.symbols.parameters.length > 0 || skipped("PARAMETERS", state),
  },
  {
    id: "FIRST_ACTION",
    titleKey: "tutorial.steps.firstAction.title",
    descriptionKey: "tutorial.steps.firstAction.description",
    illustration: "edit_note",
    exampleKey: "tutorial.examples.firstAction",
    snippetId: "assign",
    actionKey: "actions.insert",
    isSatisfied: (context) => context.structure.statementCount > 0,
  },
  {
    id: "CONTROL_FLOW",
    titleKey: "tutorial.steps.controlFlow.title",
    descriptionKey: "tutorial.steps.controlFlow.description",
    illustration: "alt_route",
    exampleKey: "tutorial.examples.controlFlow",
    snippetId: "if",
    actionKey: "actions.insert",
    isSatisfied: (context, state) =>
      context.structure.hasConditional ||
      context.structure.hasLoop ||
      skipped("CONTROL_FLOW", state),
  },
  {
    id: "OUTPUT",
    titleKey: "tutorial.steps.output.title",
    descriptionKey: "tutorial.steps.output.description",
    illustration: "output",
    exampleKey: "tutorial.examples.output",
    snippetId: "return-value",
    actionKey: "actions.insert",
    isSatisfied: (context) => context.structure.hasOutput,
  },
  {
    id: "REVIEW",
    titleKey: "tutorial.steps.review.title",
    descriptionKey: "tutorial.steps.review.description",
    illustration: "analytics",
    exampleKey: "tutorial.examples.review",
    actionKey: "actions.analyze",
    isSatisfied: (context) => context.capabilities.canAnalyze,
  },
];

export function getTutorialStep(id: TutorialStep["id"]): TutorialStep {
  return tutorialSteps.find((step) => step.id === id) ?? tutorialSteps[0]!;
}
