"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { EditorContext } from "../context/types";
import { getContextualRecommendations } from "../recommendations";
import type { GuidanceRecommendation } from "../recommendations";
import {
  createInitialTutorialState,
  readTutorialState,
  nextTutorialStep,
  previousTutorialStep,
  skipTutorial,
  startTutorial,
  TUTORIAL_STEP_IDS,
  writeTutorialState,
  type ManualTutorialState,
} from "../tutorial";
import { ContextualGuidance } from "./ContextualGuidance";
import { TutorialGuide } from "./TutorialGuide";
import { TutorialWelcome } from "./TutorialWelcome";
import type { ManualEditorActions } from "./types";

const RECOMMENDATION_DEBOUNCE_MS = 220;

interface ManualGuidancePanelProps {
  readonly context: EditorContext;
  readonly editorActions: ManualEditorActions;
  readonly onAnalyze: () => void;
  readonly onActiveRecommendationChange?: (
    recommendation: GuidanceRecommendation | null,
  ) => void;
}

export function ManualGuidancePanel({
  context,
  editorActions,
  onAnalyze,
  onActiveRecommendationChange,
}: Readonly<ManualGuidancePanelProps>) {
  const t = useTranslations("analyzer.manualGuidance");
  const [tutorialState, setTutorialState] = useState<ManualTutorialState>(() =>
    createInitialTutorialState(),
  );
  const [isTutorialStateHydrated, setIsTutorialStateHydrated] = useState(false);
  useEffect(() => {
    setTutorialState(readTutorialState());
    setIsTutorialStateHydrated(true);
  }, []);
  useEffect(() => {
    if (!isTutorialStateHydrated) return;
    writeTutorialState(tutorialState);
  }, [isTutorialStateHydrated, tutorialState]);
  const previousContextRef = useRef(context);
  const [debouncedContext, setDebouncedContext] = useState(context);
  const [isRecommendationDebouncing, setIsRecommendationDebouncing] =
    useState(false);
  useEffect(() => {
    if (previousContextRef.current === context) return;

    previousContextRef.current = context;
    setIsRecommendationDebouncing(true);
    onActiveRecommendationChange?.(null);

    const timeout = globalThis.window.setTimeout(() => {
      setDebouncedContext(context);
      setIsRecommendationDebouncing(false);
    }, RECOMMENDATION_DEBOUNCE_MS);

    return () => globalThis.window.clearTimeout(timeout);
  }, [context, onActiveRecommendationChange]);
  const recommendations = useMemo(
    () =>
      isRecommendationDebouncing
        ? []
        : getContextualRecommendations(debouncedContext, { limit: 4 }),
    [debouncedContext, isRecommendationDebouncing],
  );
  const showTutorial =
    tutorialState.status === "not_started" ||
    tutorialState.status === "in_progress";
  useEffect(() => {
    if (showTutorial) onActiveRecommendationChange?.(null);
  }, [onActiveRecommendationChange, showTutorial]);
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

  if (!isTutorialStateHydrated) {
    return (
      <div
        aria-busy="true"
        className="h-full min-h-0 rounded-xl border border-white/10 bg-[#101a23]"
      />
    );
  }

  if (showTutorial)
    return (
      <div
        key="manual-tutorial"
        className="manual-guidance-panel-transition relative flex h-full min-h-0 flex-col items-center overflow-x-hidden overflow-y-auto rounded-xl border border-white/10 bg-[#101a23] text-white"
      >
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
                  setTutorialState((state) => skipTutorial(state))
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
    <div
      key="manual-contextual-guidance"
      className="manual-guidance-panel-transition flex h-full min-h-0 items-center justify-center overflow-y-auto rounded-xl border border-white/10 bg-[#101a23] text-white"
    >
      <ContextualGuidance
        context={context}
        recommendations={recommendations}
        onAnalyze={onAnalyze}
        onTutorial={openTutorial}
        onActiveRecommendationChange={onActiveRecommendationChange}
      />
    </div>
  );
}

export function ManualGuidanceEmptyLabel() {
  const t = useTranslations("analyzer.manualGuidance");
  return <span className="sr-only">{t("context.eyebrow")}</span>;
}
