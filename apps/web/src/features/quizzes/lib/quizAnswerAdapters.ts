import type { QuizQuestion, StudentAnswer } from "@aa/types";

import type { AnswerState } from "./quizCompletion";

/**
 * Adapts the internal UI answer state to the format expected by the API.
 */
export function toStudentAnswers(
  questions: QuizQuestion[],
  answersByQuestion: Record<string, AnswerState>,
): StudentAnswer[] {
  return questions.map((question) => {
    const answer = answersByQuestion[question.questionId] ?? {};

    if (question.type === "single_choice" || question.type === "true_false") {
      return {
        questionId: question.questionId,
        selectedOptionIds: answer.selectedOptionIds ?? [],
      };
    }

    if (question.type === "multiple_choice") {
      return {
        questionId: question.questionId,
        selectedOptionIds: answer.selectedOptionIds ?? [],
      };
    }

    if (question.type === "ordering") {
      return {
        questionId: question.questionId,
        orderedOptionIds:
          answer.orderedOptionIds ??
          (question.options ?? []).map((item) => item.optionId),
      };
    }

    // Default handles match_pairs and others
    return {
      questionId: question.questionId,
      pairs: answer.pairs ?? [],
    };
  });
}
