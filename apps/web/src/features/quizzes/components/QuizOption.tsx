"use client";

import type { ReactNode } from "react";

import { QuizOptionIndicator } from "./QuizOptionIndicator";
import { surfaceClassesForQuizOptionState } from "./quizOptionSurface";
import type { QuizOptionKind, QuizOptionState } from "./types";

export interface QuizOptionProps {
  id: string;
  kind?: QuizOptionKind;
  state?: QuizOptionState;
  checked?: boolean;
  disabled?: boolean;
  index?: number;
  label?: ReactNode;
  description?: ReactNode;
  feedback?: ReactNode;
  showFeedback?: boolean;
  showIndicator?: boolean;
  onSelect?: (id: string) => void;
}

export function QuizOption({
  id,
  kind = "neutral",
  state = "idle",
  checked = false,
  disabled = false,
  index,
  label,
  description,
  feedback,
  showFeedback = false,
  showIndicator = true,
  onSelect,
}: QuizOptionProps) {
  const effectiveState =
    state !== "idle"
      ? state
      : checked
        ? "selected"
        : disabled
          ? "disabled"
          : "idle";
  const interactive = !!onSelect && !disabled;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => onSelect?.(id)}
        disabled={!interactive}
        aria-pressed={checked}
        aria-disabled={!interactive}
        className={`group w-full rounded-xl border border-solid px-3 py-3 text-left transition-all duration-200 ${surfaceClassesForQuizOptionState(effectiveState)} ${
          interactive
            ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            : "cursor-default"
        }`}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            {showIndicator ? (
              <QuizOptionIndicator
                kind={kind}
                state={effectiveState}
                checked={checked}
                disabled={disabled}
                index={index}
              />
            ) : null}
            <div className="min-w-0 flex-1 self-center">
              <span className="block text-sm leading-relaxed text-slate-100">
                {label}
              </span>
              {description ? (
                <span className="mt-0.5 block text-xs text-slate-300">
                  {description}
                </span>
              ) : null}
            </div>
          </div>
          {showFeedback && feedback ? (
            <div
              className={`${
                showIndicator ? "ml-9" : "ml-0"
              } [&>*]:mb-0 mt-2 text-[11px] italic leading-relaxed text-slate-400`}
            >
              {feedback}
            </div>
          ) : null}
        </div>
      </button>
    </div>
  );
}
