"use client";

import type { QuizQuestion } from "@aa/types";

import RenderableContent from "@/components/content/RenderableContent";
import type {
  QuizOptionState,
  QuizOptionViewModel,
} from "@/features/quizzes/components/types";

import { MultipleChoiceGroup } from "./MultipleChoiceGroup";

interface Props {
  question: QuizQuestion;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  stateById?: Record<string, QuizOptionState>;
}

export function MultipleChoiceQuestion({
  question,
  value,
  onChange,
  disabled = false,
  showFeedback = false,
  stateById,
}: Props) {
  const options: QuizOptionViewModel[] = (question.options ?? []).map(
    (option) => ({
      id: option.optionId,
      content: (
        <RenderableContent
          content={option.content}
          className="[&>*]:mb-0 text-sm"
        />
      ),
      feedback: (
        <RenderableContent
          content={{ blocks: option.feedback.blocks }}
          className="[&>*]:mb-0 text-[11px] italic leading-relaxed text-slate-400"
        />
      ),
    }),
  );

  return (
    <MultipleChoiceGroup
      options={options}
      value={value}
      disabled={disabled}
      showFeedback={showFeedback}
      stateById={stateById}
      onChange={onChange}
    />
  );
}
