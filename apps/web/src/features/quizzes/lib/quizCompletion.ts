import type { QuizQuestion } from "@aa/types";

export type AnswerState = {
  selectedOptionIds?: string[];
  orderedOptionIds?: string[];
  pairs?: Array<{ leftId: string; rightId: string }>;
};

/**
 * Checks if a question has been sufficiently answered based on its type.
 * Note: For ordering questions, the current policy assumes it's complete if options exist.
 */
export function isQuestionComplete(
  question: QuizQuestion,
  answer: AnswerState | undefined,
): boolean {
  if (question.type === "single_choice" || question.type === "true_false") {
    return !!answer?.selectedOptionIds?.[0];
  }
  if (question.type === "multiple_choice") {
    return (answer?.selectedOptionIds?.length ?? 0) > 0;
  }
  if (question.type === "ordering") {
    return (
      (answer?.orderedOptionIds?.length ?? 0) > 0 ||
      (question.options?.length ?? 0) > 0
    );
  }
  if (question.type === "match_pairs") {
    const leftCount = question.leftItems?.length ?? 0;
    const pairCount = answer?.pairs?.length ?? 0;
    return leftCount > 0 && pairCount >= leftCount;
  }
  return false;
}
