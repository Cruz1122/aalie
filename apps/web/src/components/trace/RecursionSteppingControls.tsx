/**
 * RecursionSteppingControls Component
 *
 * Provides interactive controls for stepping through recursive call tree visualization.
 */

"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import type {
  RecursionStepperState,
  RecursionStepperActions,
} from "@/hooks/useRecursionStepper";
import type { GraphNode } from "@/types/trace";

interface RecursionSteppingControlsProps {
  state: RecursionStepperState;
  actions: RecursionStepperActions;
  currentNode: GraphNode | undefined;
  className?: string;
}

export default function RecursionSteppingControls({
  state,
  actions,
  currentNode,
  className = "",
}: RecursionSteppingControlsProps) {
  const t = useTranslations("analyzer.executionTrace");
  const isReturnEvent = state.currentEventKind === "return";

  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      actions.setPlaybackSpeed(Number(e.target.value));
    },
    [actions],
  );

  const handleStepChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      actions.setCurrentStep(Number(e.target.value));
    },
    [actions],
  );

  const stepFill =
    state.totalSteps <= 1
      ? 100
      : (state.currentStep / Math.max(1, state.totalSteps - 1)) * 100;

  const speedFill = Math.max(
    0,
    Math.min(100, ((state.playbackSpeed - 100) / (5000 - 100)) * 100),
  );

  if (state.totalSteps === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-slate-700/70 bg-slate-950/70 p-3 shadow-lg shadow-black/10 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-100">
          {t("steppingTitle")}
        </h3>
        <span className="text-xs text-slate-400">
          {t("stepOf", {
            current: state.currentStep + 1,
            total: state.totalSteps,
          })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={actions.togglePlayback}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/20"
          title={state.isPlaying ? t("pause") : t("play")}
        >
          {state.isPlaying ? `⏸ ${t("pause")}` : `▶ ${t("play")}`}
        </button>

        <button
          onClick={actions.prevStep}
          disabled={state.currentStep === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          title={t("previousStep")}
        >
          ◀ {t("previousStep")}
        </button>

        <button
          onClick={actions.nextStep}
          disabled={state.currentStep >= state.totalSteps - 1}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          title={t("nextStep")}
        >
          {t("nextStep")} ▶
        </button>

        <button
          onClick={actions.reset}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
          title={t("restart")}
        >
          ⊙ {t("restart")}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label
          htmlFor="step-slider"
          className="min-w-[3.5rem] text-xs font-medium uppercase tracking-wide text-slate-400"
        >
          {t("steppingStep")}:
        </label>
        <input
          id="step-slider"
          type="range"
          min="0"
          max={Math.max(0, state.totalSteps - 1)}
          value={state.currentStep}
          onChange={handleStepChange}
          className="range-base input-size-slider flex-1 cursor-pointer rounded appearance-none h-2"
          style={{
            background: `linear-gradient(to right, rgb(56, 189, 248) 0%, rgb(56, 189, 248) ${stepFill}%, rgb(51, 65, 85) ${stepFill}%, rgb(51, 65, 85) 100%)`,
            backgroundRepeat: "no-repeat",
          }}
        />
        <span className="w-10 text-right text-xs text-slate-300">
          {state.currentStep + 1}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <label
          htmlFor="speed-slider"
          className="min-w-[3.5rem] text-xs font-medium uppercase tracking-wide text-slate-400"
        >
          {t("steppingSpeed")}:
        </label>
        <input
          id="speed-slider"
          type="range"
          min="100"
          max="5000"
          step="100"
          value={state.playbackSpeed}
          onChange={handleSpeedChange}
          className="range-base input-size-slider flex-1 cursor-pointer rounded appearance-none h-2"
          style={{
            background: `linear-gradient(to right, rgb(56, 189, 248) 0%, rgb(56, 189, 248) ${speedFill}%, rgb(51, 65, 85) ${speedFill}%, rgb(51, 65, 85) 100%)`,
            backgroundRepeat: "no-repeat",
          }}
        />
        <span className="w-16 text-right text-xs text-slate-300">
          {(state.playbackSpeed / 1000).toFixed(1)}s
        </span>
      </div>

      {currentNode && currentNode.data && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
          <div className="font-semibold text-slate-100">
            {currentNode.data.label}
          </div>
          {isReturnEvent ? (
            <div className="text-xs font-medium text-emerald-300">
              {t("phase_return")}
            </div>
          ) : (
            <div className="text-xs text-slate-400">{t("phase_expansion")}</div>
          )}
          {isReturnEvent && currentNode.data.returnValue !== undefined && (
            <div className="text-xs text-emerald-300">
              ↩ {String(currentNode.data.returnValue)}
            </div>
          )}
          {currentNode.data.depth !== undefined && (
            <div className="text-xs text-slate-400">
              {t("steppingDepth")}: {currentNode.data.depth}
            </div>
          )}
        </div>
      )}

      <p className="text-xs italic leading-relaxed text-slate-400">
        {t("steppingInfo")}
      </p>
    </div>
  );
}
