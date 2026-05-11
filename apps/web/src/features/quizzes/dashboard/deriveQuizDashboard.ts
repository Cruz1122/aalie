import type {
  StoredQuizAttempt,
  StoredQuizProgress,
} from "../storage/quizStorageTypes";

export interface QuizDashboardMetrics {
  totalAttempts: number;
  averageAccuracy: number;
  recentAttempts: StoredQuizAttempt[];
  topStrengths: string[];
  topAreasToImprove: string[];
}

export function deriveQuizDashboardMetrics(
  attempts: StoredQuizAttempt[],
  _progress: StoredQuizProgress | null,
): QuizDashboardMetrics {
  if (!attempts || attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageAccuracy: 0,
      recentAttempts: [],
      topStrengths: [],
      topAreasToImprove: [],
    };
  }

  const totalAttempts = attempts.length;
  const avgAcc =
    attempts.reduce((acc, att) => acc + att.accuracy, 0) / totalAttempts;

  // Derive global strengths and weaknesses from all attempts
  // A simple way: aggregate topicStats across all attempts
  const topicAgg: Record<string, { correct: number; total: number }> = {};

  for (const att of attempts) {
    for (const [topic, stats] of Object.entries(att.topicStats)) {
      if (!topicAgg[topic]) {
        topicAgg[topic] = { correct: 0, total: 0 };
      }
      topicAgg[topic].correct += stats.accuracy * stats.total;
      topicAgg[topic].total += stats.total;
    }
  }

  const topicAcc = Object.entries(topicAgg).map(([topic, stats]) => ({
    topic,
    acc: stats.total > 0 ? stats.correct / stats.total : 0,
    total: stats.total,
  }));

  // Sort by accuracy DESC for strengths, ASC for areas to improve
  const strengths = [...topicAcc]
    .filter((t) => t.total >= 2 && t.acc >= 0.8)
    .sort((a, b) => b.acc - a.acc)
    .map((t) => t.topic);
  const weaknesses = [...topicAcc]
    .filter((t) => t.total >= 2 && t.acc < 0.6)
    .sort((a, b) => a.acc - b.acc)
    .map((t) => t.topic);

  // If no aggregated ones, fallback to the latest attempt's ones
  const finalStrengths =
    strengths.length > 0
      ? strengths.slice(0, 3)
      : attempts[0]?.strengths.slice(0, 3) || [];
  const finalWeaknesses =
    weaknesses.length > 0
      ? weaknesses.slice(0, 3)
      : attempts[0]?.areasToImprove.slice(0, 3) || [];

  return {
    totalAttempts,
    averageAccuracy: avgAcc,
    recentAttempts: attempts.slice(0, 5),
    topStrengths: finalStrengths,
    topAreasToImprove: finalWeaknesses,
  };
}
