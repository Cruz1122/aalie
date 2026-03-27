"use client";

import { useTranslations } from "next-intl";

interface StepControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  loading: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReset: () => void;
}

export default function StepControls({
  currentStep,
  totalSteps,
  isPlaying,
  loading,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onReset,
}: StepControlsProps) {
  const t = useTranslations("analyzer.executionTrace");
  return (
    <div className="flex flex-row items-center gap-2 mb-3 flex-shrink-0 flex-wrap">
      {/* Step Counter */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600 flex-shrink-0">
        <span className="material-symbols-outlined text-xs text-blue-400">
          info
        </span>
        <span className="text-xs text-slate-300 font-semibold tabular-nums">
          {t("stepOf", { current: currentStep + 1, total: totalSteps })}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onReset}
          disabled={loading}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={t("restart")}
          aria-label={t("restart")}
        >
          <span className="material-symbols-outlined text-base text-white leading-none">
            restart_alt
          </span>
        </button>
        <button
          onClick={onPrevious}
          disabled={currentStep === 0 || loading}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={t("previousStep")}
          aria-label={t("previousStep")}
        >
          <span className="material-symbols-outlined text-base text-white leading-none">
            skip_previous
          </span>
        </button>
        {isPlaying ? (
          <button
            onClick={onPause}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={t("pause")}
            aria-label={t("pause")}
          >
            <span className="material-symbols-outlined text-base text-red-300 leading-none">
              pause
            </span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={loading || currentStep >= totalSteps - 1}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={t("play")}
            aria-label={t("play")}
          >
            <span className="material-symbols-outlined text-base text-green-300 leading-none">
              play_arrow
            </span>
          </button>
        )}
        <button
          onClick={onNext}
          disabled={loading || currentStep >= totalSteps - 1}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={t("nextStep")}
          aria-label={t("nextStep")}
        >
          <span className="material-symbols-outlined text-base text-white leading-none">
            skip_next
          </span>
        </button>
      </div>
    </div>
  );
}
