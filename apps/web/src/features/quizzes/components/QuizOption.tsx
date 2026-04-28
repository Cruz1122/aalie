"use client";

import type { ReactNode } from "react";

import { QuizOptionIndicator } from "./QuizOptionIndicator";
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

function getStateStyles(state: QuizOptionState): string {
  if (state === "correct") {
    return "!border-emerald-400/45 !bg-emerald-500/10 hover:!border-emerald-400/45 hover:!bg-emerald-500/10";
  }
  if (state === "incorrect") {
    return "!border-rose-400/45 !bg-rose-500/10 hover:!border-rose-400/45 hover:!bg-rose-500/10";
  }
  if (state === "selected") {
    return "!border-primary/40 !bg-primary/10 hover:!border-primary/40 hover:!bg-primary/10";
  }
  if (state === "revealed") {
    return "!border-amber-400/35 !bg-amber-500/10 hover:!border-amber-400/35 hover:!bg-amber-500/10";
  }
  if (state === "disabled") {
    return "!border-slate-600/70 !bg-slate-900/40 opacity-70 hover:!border-slate-600/70 hover:!bg-slate-900/40";
  }
  return "border-white/10 !bg-white/5 hover:!bg-white/5";
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
    state === "idle" && checked ? "selected" : disabled ? "disabled" : state;
  const interactive = !!onSelect && !disabled;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onSelect?.(id)}
        disabled={!interactive}
        aria-pressed={checked}
        aria-disabled={!interactive}
        className={`group glass-card w-full rounded-xl border px-3 py-3 text-left transition-colors ${getStateStyles(effectiveState)} ${
          interactive
            ? "hover:!border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            : "cursor-default"
        }`}
      >
        <span className="flex items-center gap-3">
          {showIndicator ? (
            <QuizOptionIndicator
              kind={kind}
              state={effectiveState}
              checked={checked}
              disabled={disabled}
              index={index}
            />
          ) : null}
          <span className="min-w-0 flex-1 self-center">
            <span className="block text-sm leading-relaxed text-slate-100">
              {label}
            </span>
            {description ? (
              <span className="mt-1 block text-xs text-slate-300">
                {description}
              </span>
            ) : null}
          </span>
        </span>
      </button>

      {showFeedback && feedback ? (
        <div
          className={`${showIndicator ? "ml-9" : "ml-1"} text-xs text-slate-400`}
        >
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
