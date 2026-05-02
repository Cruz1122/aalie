import { safeGet, safeSet } from "./quizLocalStorage";
import type { StoredQuizAttempt } from "./quizStorageTypes";

export const QUIZ_ATTEMPTS_STORAGE_KEY = "aalie.quiz.attempts.v1";

export function loadAttempts(): StoredQuizAttempt[] {
  return safeGet<StoredQuizAttempt[]>(QUIZ_ATTEMPTS_STORAGE_KEY, []);
}

export function loadAttemptById(id: string): StoredQuizAttempt | undefined {
  const attempts = loadAttempts();
  return attempts.find((a) => a.attemptId === id);
}

export function appendAttempt(attempt: StoredQuizAttempt, maxKeep = 20): void {
  const current = loadAttempts();
  const next = [attempt, ...current];
  const pruned = next.slice(0, maxKeep);
  safeSet(QUIZ_ATTEMPTS_STORAGE_KEY, pruned);
}
