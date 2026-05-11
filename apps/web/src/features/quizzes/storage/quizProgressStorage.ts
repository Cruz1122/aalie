import type { ContentRef, QuizAttemptResult } from "@aa/types";

import { safeGet, safeSet } from "./quizLocalStorage";
import type { StoredQuizAttempt, StoredQuizProgress } from "./quizStorageTypes";

export const QUIZ_PROGRESS_STORAGE_KEY = "aalie.quiz.progress.v1";
export const CONTENT_PROGRESS_REFS_STORAGE_KEY = "aalie.content.progress.v1";

export const INITIAL_PROGRESS: StoredQuizProgress = {
  masteryBySkill: {},
  recentQuestionIds: [],
  weakSkillIds: [],
  lastFailedSkillIds: [],
  lastFailedTopicIds: [],
  updatedAt: 0,
};

export function loadQuizProgress(): StoredQuizProgress {
  const raw = safeGet<Partial<StoredQuizProgress>>(
    QUIZ_PROGRESS_STORAGE_KEY,
    INITIAL_PROGRESS,
  );
  return {
    ...INITIAL_PROGRESS,
    masteryBySkill: raw?.masteryBySkill ?? {},
    recentQuestionIds: raw?.recentQuestionIds ?? [],
    weakSkillIds: raw?.weakSkillIds ?? [],
    lastFailedSkillIds: raw?.lastFailedSkillIds ?? [],
    lastFailedTopicIds: raw?.lastFailedTopicIds ?? [],
    updatedAt: raw?.updatedAt ?? Date.now(),
  };
}

export function saveQuizProgress(snapshot: StoredQuizProgress): void {
  safeSet(QUIZ_PROGRESS_STORAGE_KEY, { ...snapshot, updatedAt: Date.now() });
}

export function loadStudiedContentRefs(): ContentRef[] {
  const parsed = safeGet<{ studiedContentRefs?: ContentRef[] }>(
    CONTENT_PROGRESS_REFS_STORAGE_KEY,
    {},
  );
  return parsed?.studiedContentRefs ?? [];
}

export function applyAttemptToProgress(
  progress: StoredQuizProgress,
  attempt: StoredQuizAttempt,
  result: QuizAttemptResult,
  options?: { topicByQuestionId?: Record<string, string> },
): StoredQuizProgress {
  const nextMastery = { ...progress.masteryBySkill };

  for (const [skill, delta] of Object.entries(result.masteryDeltaBySkill)) {
    const base = nextMastery[skill] ?? 0.5;
    nextMastery[skill] = Math.max(0, Math.min(1, base + delta));
  }

  const recents = [
    ...result.results.map((item) => item.questionId),
    ...progress.recentQuestionIds,
  ].slice(0, 50);

  const lastFailedSkillIds = new Set<string>();
  const lastFailedTopicIds = new Set<string>();

  const topicByQ = options?.topicByQuestionId ?? {};
  for (const item of result.results) {
    if (!item.isCorrect) {
      item.skillIds.forEach((id) => lastFailedSkillIds.add(id));
      const topic = topicByQ[item.questionId];
      if (topic) lastFailedTopicIds.add(topic);
    }
  }

  const next: StoredQuizProgress = {
    ...progress,
    masteryBySkill: nextMastery,
    recentQuestionIds: recents,
    weakSkillIds: result.areasToImprove, // from the evaluated result
    lastFailedSkillIds: Array.from(lastFailedSkillIds),
    lastFailedTopicIds: Array.from(lastFailedTopicIds),
  };

  saveQuizProgress(next);
  return next;
}
