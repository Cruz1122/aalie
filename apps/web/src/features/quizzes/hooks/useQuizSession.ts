"use client";

import type {
  QuizQuestion,
  QuizSelectionRequest,
  QuizSession,
  QuizSessionResult,
  StudentAnswer,
} from "@aa/types";
import { useCallback, useMemo, useState } from "react";

import { createQuizAttempt, evaluateQuizAttempt } from "@/features/quizzes/api/quizClient";

import {
  applySessionResult,
  loadQuizProgress,
  loadStudiedContentRefs,
} from "./useQuizProgress";

function toWeakSkillIds(mastery: Record<string, number>): string[] {
  return Object.entries(mastery)
    .filter(([, value]) => value < 0.5)
    .map(([skill]) => skill)
    .sort();
}

export function useQuizSession() {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [result, setResult] = useState<QuizSessionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (questionCount = 5) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const progress = loadQuizProgress();
      const payload: QuizSelectionRequest = {
        studentId: null,
        studiedContentRefs: loadStudiedContentRefs(),
        masteryBySkill: progress.masteryBySkill,
        weakSkillIds: toWeakSkillIds(progress.masteryBySkill),
        recentQuestionIds: progress.recentQuestionIds,
        sessionPreferences: { questionCount, difficultyMix: {} },
      };
      const created = await createQuizAttempt(payload);
      setSession(created);
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAnswers = useCallback(
    async (answers: StudentAnswer[]) => {
      if (!session) {
        throw new Error("No active session");
      }
      setLoading(true);
      setError(null);
      try {
        const evaluated = await evaluateQuizAttempt({
          sessionId: session.sessionId,
          questionIds: session.questions.map((question) => question.questionId),
          answers,
        });
        setResult(evaluated);
        applySessionResult(evaluated);
        return evaluated;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session],
  );

  const questions = useMemo(
    () => (session?.questions ?? []) as QuizQuestion[],
    [session],
  );

  return {
    session,
    result,
    loading,
    error,
    startSession,
    submitAnswers,
    questions,
  };
}
