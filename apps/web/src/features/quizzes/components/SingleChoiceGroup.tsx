"use client";

import { QuizOptionGroup } from "./QuizOptionGroup";
import type { QuizOptionState, QuizOptionViewModel } from "./types";

export interface SingleChoiceGroupProps {
  options: QuizOptionViewModel[];
  value?: string;
  disabled?: boolean;
  showFeedback?: boolean;
  stateById?: Record<string, QuizOptionState>;
  onChange?: (id: string) => void;
}

export function SingleChoiceGroup({
  options,
  value,
  disabled = false,
  showFeedback = false,
  stateById,
  onChange,
}: SingleChoiceGroupProps) {
  return (
    <QuizOptionGroup
      kind="single"
      options={options}
      selectedIds={value ? [value] : []}
      disabled={disabled}
      showFeedback={showFeedback}
      stateById={stateById}
      onChange={(next) => onChange?.(next[0] ?? "")}
    />
  );
}

