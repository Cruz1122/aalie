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
  const parameterOption = (
    parameter: string,
    actionKey: string,
  ) => ({
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
  const renderDescription = (): ReactNode => {
    const description = t(step.descriptionKey);
    if (step.id !== "PARAMETERS") return description;

    const termEntries = [
      { label: t("actions.scalarParameter"), termKey: "scalar" },
      { label: t("actions.arrayParameter"), termKey: "array" },
      { label: t("actions.rangeParameter"), termKey: "range" },
      { label: t("actions.objectParameter"), termKey: "object" },
    ];
    const termPattern = new RegExp(
      "(" +
        termEntries.map((entry) => entry.label).join("|") +
        ")",
      "gi",
    );

    return description.split(termPattern).map((part, index) => {
      const entry = termEntries.find(
        (candidate) =>
          candidate.label.toLocaleLowerCase() === part.toLocaleLowerCase(),
      );
      if (!entry) return part;

      return (
        <TermInline
          key={"parameter-term-" + index}
          text={part}
          term={{
            label: t("parameterTerms." + entry.termKey + ".label"),
            definition: t("parameterTerms." + entry.termKey + ".definition"),
          }}
        />
      );
    });
  };
  const onAction = () => {
    if (step.id === "REVIEW") return onAnalyze();
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
            actionOptions={parameterOptions}
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
