"use client";

import { QuizOption } from "./QuizOption";
import type {
  QuizOptionKind,
  QuizOptionState,
  QuizOptionViewModel,
} from "./types";

export interface QuizOptionGroupProps {
  kind: QuizOptionKind;
  options: QuizOptionViewModel[];
  selectedIds?: string[];
  disabled?: boolean;
  showFeedback?: boolean;
  stateById?: Record<string, QuizOptionState>;
  onChange?: (selectedIds: string[]) => void;
}

export function QuizOptionGroup({
  kind,
  options,
  selectedIds = [],
  disabled = false,
  showFeedback = false,
  stateById,
  onChange,
}: QuizOptionGroupProps) {
  const selected = new Set(selectedIds);

  return (
    <div className="space-y-2.5">
      {options.map((option, index) => {
        const optionState = stateById?.[option.id] ?? option.state ?? "idle";
        const shouldShowFeedback = showFeedback && selected.has(option.id);

        return (
          <QuizOption
            key={option.id}
            id={option.id}
            kind={kind}
            checked={selected.has(option.id)}
            state={optionState}
            disabled={disabled || option.disabled}
            index={index}
            label={option.content}
            description={option.description}
            feedback={option.feedback}
            showFeedback={shouldShowFeedback}
            onSelect={(id) => {
              if (!onChange) return;
              if (kind === "single") {
                onChange([id]);
                return;
              }
              if (kind === "multiple") {
                const next = new Set(selected);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                onChange(Array.from(next));
                return;
              }
              onChange(selectedIds);
            }}
          />
        );
      })}
    </div>
  );
}
