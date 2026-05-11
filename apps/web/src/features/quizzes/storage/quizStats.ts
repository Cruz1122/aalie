import type { QuizAttemptResult, QuizDifficulty } from "@aa/types";

import type {
  QuizAttemptAreaStats,
  QuizAttemptDifficultyStats,
} from "./quizStorageTypes";

export function computeAreaStats(
  result: QuizAttemptResult,
  getKey: (res: QuizAttemptResult["results"][0]) => string[],
): Record<string, QuizAttemptAreaStats> {
  const stats: Record<string, { correct: number; total: number }> = {};

  for (const item of result.results) {
    const keys = getKey(item);
    for (const key of keys) {
      if (!stats[key]) {
        stats[key] = { correct: 0, total: 0 };
      }
      stats[key].total += 1;
      if (item.isCorrect) {
        stats[key].correct += 1;
      }
    }
  }

  const finalStats: Record<string, QuizAttemptAreaStats> = {};
  for (const [key, data] of Object.entries(stats)) {
    finalStats[key] = {
      accuracy: data.total > 0 ? data.correct / data.total : 0,
      total: data.total,
    };
  }
  return finalStats;
}

export function computeDifficultyBreakdown(
  result: QuizAttemptResult,
  getDifficulty: (res: QuizAttemptResult["results"][0]) => QuizDifficulty,
): Record<QuizDifficulty, QuizAttemptDifficultyStats> {
  const stats: Record<QuizDifficulty, { correct: number; total: number }> = {
    basic: { correct: 0, total: 0 },
    intermediate: { correct: 0, total: 0 },
    advanced: { correct: 0, total: 0 },
  };

  for (const item of result.results) {
    const diff = getDifficulty(item);
    if (!stats[diff]) continue;
    stats[diff].total += 1;
    if (item.isCorrect) {
      stats[diff].correct += 1;
    }
  }

  const finalStats: Partial<
    Record<QuizDifficulty, QuizAttemptDifficultyStats>
  > = {};
  for (const [key, data] of Object.entries(stats)) {
    const diff = key as QuizDifficulty;
    finalStats[diff] = {
      accuracy: data.total > 0 ? data.correct / data.total : 0,
      total: data.total,
    };
  }
  return finalStats as Record<QuizDifficulty, QuizAttemptDifficultyStats>;
}

export function extractContentRefs(result: QuizAttemptResult): string[] {
  const refs = new Set<string>();
  for (const item of result.results) {
    for (const ref of item.contentRefs) {
      if (ref.moduleId) {
        refs.add(ref.moduleId);
      }
    }
  }
  return Array.from(refs);
}
