"use client";

import { QuizOptionGroup } from "./QuizOptionGroup";
import type { QuizOptionState, QuizOptionViewModel } from "./types";

export interface MultipleChoiceGroupProps {
  options: QuizOptionViewModel[];
  value?: string[];
  disabled?: boolean;
  showFeedback?: boolean;
  stateById?: Record<string, QuizOptionState>;
  onChange?: (ids: string[]) => void;
}

export function MultipleChoiceGroup({
  options,
  value = [],
  disabled = false,
  showFeedback = false,
  stateById,
  onChange,
}: MultipleChoiceGroupProps) {
  return (
    <QuizOptionGroup
      kind="multiple"
      options={options}
      selectedIds={value}
      disabled={disabled}
      showFeedback={showFeedback}
      stateById={stateById}
      onChange={onChange}
    />
  );
}

