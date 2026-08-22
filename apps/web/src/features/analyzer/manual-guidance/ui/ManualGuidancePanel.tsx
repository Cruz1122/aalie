"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { EditorContext } from "../context/types";
import { getContextualRecommendations } from "../recommendations";
import {
  createInitialTutorialState,
  readTutorialState,
  nextTutorialStep,
  previousTutorialStep,
  skipCurrentTutorialStep,
  startTutorial,
  TUTORIAL_STEP_IDS,
  writeTutorialState,
  type ManualTutorialState,
} from "../tutorial";
import { ContextualGuidance } from "./ContextualGuidance";
import { TutorialGuide } from "./TutorialGuide";
import { TutorialWelcome } from "./TutorialWelcome";
import type { ManualEditorActions } from "./types";

interface ManualGuidancePanelProps {
  readonly context: EditorContext;
  readonly editorActions: ManualEditorActions;
  readonly onAnalyze: () => void;
}

export function ManualGuidancePanel({
  context,
  editorActions,
  onAnalyze,
}: Readonly<ManualGuidancePanelProps>) {
  const t = useTranslations("analyzer.manualGuidance");
  const [tutorialState, setTutorialState] = useState<ManualTutorialState>(() =>
    createInitialTutorialState(),
  );
  useEffect(() => setTutorialState(readTutorialState()), []);
  useEffect(() => writeTutorialState(tutorialState), [tutorialState]);
  const recommendations = useMemo(
    () => getContextualRecommendations(context, { limit: 4 }),
    [context],
  );
  const showTutorial =
    tutorialState.status === "not_started" ||
    tutorialState.status === "in_progress";
  const openTutorial = useCallback(
    () =>
      setTutorialState((state) =>
        startTutorial({ ...state, currentStepId: "HEADER" }),
      ),
    [],
  );
  const currentStepIndex = TUTORIAL_STEP_IDS.indexOf(
    tutorialState.currentStepId,
  );
  const tutorialStepCount = TUTORIAL_STEP_IDS.length;
  const progress = ((currentStepIndex + 1) / tutorialStepCount) * 100;
  const isWelcomeStep = tutorialState.currentStepId === "WELCOME";
  const previousStepIndexRef = useRef(currentStepIndex);
  const stepDirection =
    currentStepIndex < previousStepIndexRef.current ? "backward" : "forward";

  useEffect(() => {
    previousStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  if (showTutorial)
    return (
      <div className="relative flex h-full min-h-0 flex-col items-center overflow-x-hidden overflow-y-auto rounded-xl border border-white/10 bg-[#101a23] text-white">
        <div
          className="sticky top-0 z-10 h-1.5 w-full shrink-0 bg-white/10"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={tutorialStepCount}
          aria-valuenow={currentStepIndex + 1}
          aria-label={t("tutorial.progress", {
            current: currentStepIndex + 1,
            total: tutorialStepCount,
          })}
        >
          <div
            className="h-full bg-cyan-300 transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex min-h-0 w-full flex-1 justify-center overflow-x-hidden p-4">
          <div
            key={tutorialState.currentStepId}
            className={
              "manual-tutorial-step manual-tutorial-step-" +
              stepDirection +
              " flex min-h-0 w-full flex-1 justify-center overflow-x-hidden"
            }
          >
            {isWelcomeStep ? (
              <TutorialWelcome
                canGoBack={currentStepIndex > 0}
                canAdvance
                onBack={() =>
                  setTutorialState((state) => previousTutorialStep(state))
                }
                onNext={() =>
                  setTutorialState((state) =>
                    nextTutorialStep(startTutorial(state)),
                  )
                }
                onSkip={() =>
                  setTutorialState((state) => skipCurrentTutorialStep(state))
                }
              />
            ) : (
              <TutorialGuide
                context={context}
                state={tutorialState}
                actions={editorActions}
                onAnalyze={onAnalyze}
                onStateChange={setTutorialState}
              />
            )}
          </div>
        </div>
      </div>
    );
  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto rounded-xl border border-white/10 bg-[#101a23] text-white">
      <ContextualGuidance
        context={context}
        recommendations={recommendations}
        actions={editorActions}
        onAnalyze={onAnalyze}
        onTutorial={openTutorial}
      />
    </div>
  );
}

export function ManualGuidanceEmptyLabel() {
  const t = useTranslations("analyzer.manualGuidance");
  return <span className="sr-only">{t("context.eyebrow")}</span>;
}
