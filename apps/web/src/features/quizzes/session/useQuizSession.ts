"use client";

import type {
  QuizQuestion,
  QuizSelectionRequest,
  QuizSession,
  QuizSessionResult,
  StudentAnswer,
} from "@aa/types";
import { useLocale } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import {
  createQuizAttempt,
  evaluateQuizAttempt,
} from "@/features/quizzes/api/quizClient";

import { appendAttempt } from "../storage/quizAttemptStorage";
import {
  applyAttemptToProgress,
  loadQuizProgress,
  loadStudiedContentRefs,
} from "../storage/quizProgressStorage";
import {
  computeAreaStats,
  computeDifficultyBreakdown,
} from "../storage/quizStats";
import type { StoredQuizAttempt } from "../storage/quizStorageTypes";

function toWeakSkillIds(mastery: Record<string, number>): string[] {
  return Object.entries(mastery)
    .filter(([, value]) => value < 0.5)
    .map(([skill]) => skill)
    .sort();
}

function mergeWeakSkillIds(progress: {
  masteryBySkill: Record<string, number>;
  weakSkillIds: string[];
  lastFailedSkillIds: string[];
}): string[] {
  return Array.from(
    new Set([
      ...toWeakSkillIds(progress.masteryBySkill),
      ...progress.weakSkillIds,
      ...progress.lastFailedSkillIds,
    ]),
  ).sort();
}

export interface QuizSessionOptions {
  moduleId?: string;
  moduleTitle?: string;
  selectedTopicIds?: string[];
  selectedSkillIds?: string[];
  questionCount?: number;
  difficultyMix?: Record<"basic" | "intermediate" | "advanced", number>;
}

export function useQuizSession(options: QuizSessionOptions = {}) {
  const locale = useLocale();
  const [session, setSession] = useState<QuizSession | null>(null);
  const [result, setResult] = useState<QuizSessionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(
    async (fallbackQuestionCount = 5) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const progress = loadQuizProgress();
        const payload: QuizSelectionRequest = {
          studentId: null,
          studiedContentRefs: loadStudiedContentRefs(),
          masteryBySkill: progress.masteryBySkill,
          weakSkillIds: mergeWeakSkillIds(progress),
          weakTopics:
            progress.lastFailedTopicIds.length > 0
              ? [...progress.lastFailedTopicIds].sort()
              : undefined,
          recentQuestionIds: progress.recentQuestionIds,
          sessionPreferences: {
            questionCount: options.questionCount ?? fallbackQuestionCount,
            difficultyMix: options.difficultyMix ?? {},
            moduleId: options.moduleId,
            topicIds: options.selectedTopicIds ?? [],
            skillIds: options.selectedSkillIds ?? [],
          },
          locale,
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
    },
    [locale, options],
  );

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
          locale: session.locale,
        });

        const storedAttempt: StoredQuizAttempt = {
          attemptId: evaluated.sessionId,
          timestamp: Date.now(),
          moduleId: options.moduleId,
          moduleTitle: options.moduleTitle,
          score: evaluated.score,
          maxScore: evaluated.maxScore,
          accuracy: evaluated.accuracy,
          areasToImprove: evaluated.areasToImprove,
          strengths: evaluated.strengths,
          topicStats: computeAreaStats(evaluated, (item) => {
            const q = session.questions.find(
              (q) => q.questionId === item.questionId,
            );
            return q ? [q.topic] : [];
          }),
          skillStats: computeAreaStats(evaluated, (item) => item.skillIds),
          difficultyStats: computeDifficultyBreakdown(evaluated, (item) => {
            const q = session.questions.find(
              (q) => q.questionId === item.questionId,
            );
            return q ? q.difficulty : "basic";
          }),
        };

        appendAttempt(storedAttempt);
        const progress = loadQuizProgress();
        const topicByQuestionId = Object.fromEntries(
          session.questions.map((q) => [q.questionId, q.topic]),
        );
        applyAttemptToProgress(progress, storedAttempt, evaluated, {
          topicByQuestionId,
        });

        setResult(evaluated);
        return evaluated;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options.moduleId, options.moduleTitle, session],
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
