"use client";

import type { QuizQuestion } from "@aa/types";

import type { QuizOptionState } from "@/features/quizzes/components/types";

import { SingleChoiceQuestion } from "./SingleChoiceQuestion";

interface Props {
  question: QuizQuestion;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  stateById?: Record<string, QuizOptionState>;
}

export function TrueFalseQuestion({
  question,
  value,
  onChange,
  disabled,
  showFeedback,
  stateById,
}: Props) {
  return (
    <SingleChoiceQuestion
      question={question}
      value={value}
      onChange={onChange}
      disabled={disabled}
      showFeedback={showFeedback}
      stateById={stateById}
    />
  );
}
