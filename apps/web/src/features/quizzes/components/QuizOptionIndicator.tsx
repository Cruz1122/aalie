"use client";

import type { QuizOptionKind, QuizOptionState } from "./types";

export interface QuizOptionIndicatorProps {
  kind: QuizOptionKind;
  state?: QuizOptionState;
  checked?: boolean;
  index?: number;
  disabled?: boolean;
}

function getIconColor(state: QuizOptionState, disabled: boolean): string {
  if (state === "correct") return "text-emerald-300";
  if (state === "incorrect") return "text-rose-300";
  if (state === "partial") return "text-amber-300";
  if (state === "revealed") return "text-amber-300";
  if (state === "selected") return "text-primary";
  if (disabled || state === "disabled") return "text-slate-500";
  return "text-slate-300";
}

export function QuizOptionIndicator({
  kind,
  state = "idle",
  checked = false,
  disabled = false,
}: QuizOptionIndicatorProps) {
  const effectiveState =
    state !== "idle"
      ? state
      : checked
        ? "selected"
        : disabled
          ? "disabled"
          : "idle";
  const color = getIconColor(effectiveState, disabled);

  if (kind === "neutral") {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center"
      >
        <span
          className={`material-symbols-outlined text-[18px] leading-none ${color}`}
        >
          drag_indicator
        </span>
      </span>
    );
  }

  const iconName =
    effectiveState === "idle" || effectiveState === "disabled"
      ? kind === "single"
        ? "radio_button_unchecked"
        : "check_box_outline_blank"
      : kind === "single"
        ? "radio_button_checked"
        : "check_box";

  return (
    <span
      aria-hidden="true"
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center"
    >
      <span
        className={`material-symbols-outlined text-[20px] leading-none ${color}`}
      >
        {iconName}
      </span>
    </span>
  );
}
