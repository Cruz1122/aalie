import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";

import { TermInline } from "@/features/content-rendering/TermInline";

import type { EditorContext } from "../context/types";
import {
  getTutorialStep,
  nextTutorialStep,
  previousTutorialStep,
  skipCurrentTutorialStep,
  type ManualTutorialState,
} from "../tutorial";
import { CodeConceptCard } from "./CodeConceptCard";
import { TutorialNavigation } from "./TutorialNavigation";
import type { ManualEditorActions } from "./types";

interface TutorialGuideProps {
  readonly context: EditorContext;
  readonly state: ManualTutorialState;
  readonly actions: ManualEditorActions;
  readonly onAnalyze: () => void;
  readonly onStateChange: (state: ManualTutorialState) => void;
}

export function TutorialGuide({
  context,
  state,
  actions,
  onAnalyze,
  onStateChange,
}: Readonly<TutorialGuideProps>) {
  const t = useTranslations("analyzer.manualGuidance");
  const step = getTutorialStep(state.currentStepId);
  const satisfied = step.isSatisfied(context, state);
  useEffect(() => {
    if (step.id === "FIRST_ACTION") {
      actions.focusAlgorithmBody?.();
    } else if (step.id === "CONTROL_FLOW") {
      actions.prepareAlgorithmBlockInsertion?.();
    } else if (step.id === "OUTPUT") {
      actions.prepareReturnInsertion?.();
    }
  }, [actions, step.id]);
  const next = () => onStateChange(nextTutorialStep(state));
  const insertParameter = (parameter: string) => {
    if (actions.insertParameterAtProcedure) {
      actions.insertParameterAtProcedure(parameter);
      return;
    }
    actions.insertTextAtCursor?.(parameter);
  };
  const parameterPreview = (parameter: string) =>
    t(step.exampleKey).replace(/\([^)]*\)/, "(" + parameter + ")");
  const parameterOption = (parameter: string, actionKey: string) => ({
    label: t(actionKey),
    onAction: () => insertParameter(parameter),
    preview: parameterPreview(parameter),
  });
  const parameterOptions =
    step.id === "PARAMETERS"
      ? [
          parameterOption("n", "actions.scalarParameter"),
          parameterOption("A[n]", "actions.arrayParameter"),
          parameterOption("A[n]..[m]", "actions.rangeParameter"),
          parameterOption("Clase objeto", "actions.objectParameter"),
        ]
      : undefined;
  const snippetOption = (
    snippetId: string,
    actionKey: string,
    previewPath: string,
  ) => ({
    label: t(actionKey),
    onAction: () => actions.insertSnippetAtCursor(snippetId),
    preview: t(previewPath),
  });
  const controlFlowOptions =
    step.id === "CONTROL_FLOW"
      ? [
          snippetOption(
            "if",
            "actions.if",
            "tutorial.examples.controlFlowOptions.if",
          ),
          snippetOption(
            "if-else",
            "actions.ifElse",
            "tutorial.examples.controlFlowOptions.ifElse",
          ),
          snippetOption(
            "for",
            "actions.for",
            "tutorial.examples.controlFlowOptions.for",
          ),
          snippetOption(
            "while",
            "actions.while",
            "tutorial.examples.controlFlowOptions.while",
          ),
          snippetOption(
            "repeat-until",
            "actions.repeatUntil",
            "tutorial.examples.controlFlowOptions.repeatUntil",
          ),
        ]
      : undefined;
  const actionOptions =
    parameterOptions ?? controlFlowOptions;
  const renderDescription = (): ReactNode => {
    const description = t(step.descriptionKey);
    const termEntries =
      step.id === "PARAMETERS"
        ? [
            {
              text: t("actions.scalarParameter"),
              label: t("parameterTerms.scalar.label"),
              definition: t("parameterTerms.scalar.definition"),
            },
            {
              text: t("actions.arrayParameter"),
              label: t("parameterTerms.array.label"),
              definition: t("parameterTerms.array.definition"),
            },
            {
              text: t("actions.rangeParameter"),
              label: t("parameterTerms.range.label"),
              definition: t("parameterTerms.range.definition"),
            },
            {
              text: t("actions.objectParameter"),
              label: t("parameterTerms.object.label"),
              definition: t("parameterTerms.object.definition"),
            },
          ]
        : step.id === "FIRST_ACTION"
          ? [
              {
                text: t("tutorialTerms.action.term"),
                label: t("tutorialTerms.action.label"),
                definition: t("tutorialTerms.action.definition"),
              },
              {
                text: t("tutorialTerms.result.term"),
                label: t("tutorialTerms.result.label"),
                definition: t("tutorialTerms.result.definition"),
              },
            ]
          : step.id === "CONTROL_FLOW"
            ? [
                {
                  text: t("tutorialTerms.condition.term"),
                  label: t("tutorialTerms.condition.label"),
                  definition: t("tutorialTerms.condition.definition"),
                },
                {
                  text: t("tutorialTerms.loop.term"),
                  label: t("tutorialTerms.loop.label"),
                  definition: t("tutorialTerms.loop.definition"),
                },
              ]
            : step.id === "OUTPUT"
              ? [
                  {
                    text: t("tutorialTerms.return.term"),
                    label: t("tutorialTerms.return.label"),
                    definition: t("tutorialTerms.return.definition"),
                  },
                  {
                    text: t("tutorialTerms.result.term"),
                    label: t("tutorialTerms.result.label"),
                    definition: t("tutorialTerms.result.definition"),
                  },
                  {
                    text: t("tutorialTerms.path.term"),
                    label: t("tutorialTerms.path.label"),
                    definition: t("tutorialTerms.path.definition"),
                  },
                ]
              : [];
    if (termEntries.length === 0) return description;

    const termPattern = new RegExp(
      "(" +
        termEntries.map((entry) => entry.text).join("|") +
        ")",
      "gi",
    );

    return description.split(termPattern).map((part, index) => {
      const entry = termEntries.find(
        (candidate) =>
          candidate.text.toLocaleLowerCase() === part.toLocaleLowerCase(),
      );
      if (!entry) return part;

      return (
        <TermInline
          key={"description-term-" + index}
          text={part}
          term={{
            label: entry.label,
            definition: entry.definition,
          }}
        />
      );
    });
  };
  const onAction = () => {
    if (step.id === "REVIEW") return onAnalyze();
    if (step.id === "OUTPUT") {
      actions.prepareReturnInsertion?.();
      return actions.insertSnippetAtCursor("return-value");
    }
    if (step.snippetId) return actions.insertSnippetAtCursor(step.snippetId);
    insertParameter("n");
  };

  return (
    <section
      aria-label={t(step.titleKey)}
      className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center bg-[#101a23] p-5 text-center"
    >
      <div className="manual-tutorial-step-content flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-6">
        <span
          className="manual-tutorial-step-illustration material-symbols-outlined text-cyan-300"
          aria-hidden="true"
          style={{ fontSize: 72, lineHeight: 1 }}
        >
          {step.illustration}
        </span>
        <div className="w-full">
          <CodeConceptCard
            key={step.id}
            title={t(step.titleKey)}
            description={renderDescription()}
            example={t(step.exampleKey)}
            actionLabel={t(step.actionKey)}
            onAction={onAction}
            actionOptions={actionOptions}
          />
        </div>
      </div>
      <TutorialNavigation
        canGoBack={state.currentStepId !== "WELCOME"}
        canAdvance={satisfied || Boolean(step.optional)}
        onBack={() => onStateChange(previousTutorialStep(state))}
        onNext={next}
        onSkip={() => onStateChange(skipCurrentTutorialStep(state))}
      />
    </section>
  );
}
