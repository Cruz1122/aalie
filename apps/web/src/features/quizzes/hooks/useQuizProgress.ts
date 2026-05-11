"use client";

import type { QuizSessionResult } from "@aa/types";

export const QUIZ_PROGRESS_STORAGE_KEY = "aalie.quiz.progress.v1";
export const CONTENT_PROGRESS_REFS_STORAGE_KEY = "aalie.content.progress.v1";

export interface QuizProgressSnapshot {
  masteryBySkill: Record<string, number>;
  answeredQuestionIds: string[];
  recentQuestionIds: string[];
  history: Array<{
    sessionId: string;
    score: number;
    maxScore: number;
    accuracy: number;
    completedAt: string;
  }>;
}

const INITIAL_PROGRESS: QuizProgressSnapshot = {
  masteryBySkill: {},
  answeredQuestionIds: [],
  recentQuestionIds: [],
  history: [],
};

function isBrowser(): boolean {
  return typeof globalThis.window !== "undefined";
}

export function loadQuizProgress(): QuizProgressSnapshot {
  if (!isBrowser()) {
    return INITIAL_PROGRESS;
  }
  const raw = globalThis.window.localStorage.getItem(QUIZ_PROGRESS_STORAGE_KEY);
  if (!raw) {
    return INITIAL_PROGRESS;
  }
  try {
    const parsed = JSON.parse(raw) as QuizProgressSnapshot;
    return {
      masteryBySkill: parsed.masteryBySkill ?? {},
      answeredQuestionIds: parsed.answeredQuestionIds ?? [],
      recentQuestionIds: parsed.recentQuestionIds ?? [],
      history: parsed.history ?? [],
    };
  } catch {
    return INITIAL_PROGRESS;
  }
}

export function saveQuizProgress(snapshot: QuizProgressSnapshot): void {
  if (!isBrowser()) {
    return;
  }
  globalThis.window.localStorage.setItem(
    QUIZ_PROGRESS_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
}

export function applySessionResult(
  result: QuizSessionResult,
): QuizProgressSnapshot {
  const current = loadQuizProgress();
  const nextMastery = { ...current.masteryBySkill };

  for (const [skill, delta] of Object.entries(result.masteryDeltaBySkill)) {
    const base = nextMastery[skill] ?? 0.5;
    nextMastery[skill] = Math.max(0, Math.min(1, base + delta));
  }

  const answered = new Set(current.answeredQuestionIds);
  for (const item of result.results) {
    answered.add(item.questionId);
  }

  const recents = [
    ...result.results.map((item) => item.questionId),
    ...current.recentQuestionIds,
  ].slice(0, 50);

  const next: QuizProgressSnapshot = {
    masteryBySkill: nextMastery,
    answeredQuestionIds: Array.from(answered),
    recentQuestionIds: recents,
    history: [
      {
        sessionId: result.sessionId,
        score: result.score,
        maxScore: result.maxScore,
        accuracy: result.accuracy,
        completedAt: new Date().toISOString(),
      },
      ...current.history,
    ].slice(0, 20),
  };

  saveQuizProgress(next);
  return next;
}

export function resetQuizProgress(): void {
  saveQuizProgress(INITIAL_PROGRESS);
}

export function loadStudiedContentRefs(): Array<{
  courseId: string;
  moduleId: string;
  chapterId: string;
  blockId?: string;
}> {
  if (!isBrowser()) {
    return [];
  }

  const raw = globalThis.window.localStorage.getItem(
    CONTENT_PROGRESS_REFS_STORAGE_KEY,
  );
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as {
      studiedContentRefs?: Array<{
        courseId: string;
        moduleId: string;
        chapterId: string;
        blockId?: string;
      }>;
    };
    return parsed.studiedContentRefs ?? [];
  } catch {
    return [];
  }
}
