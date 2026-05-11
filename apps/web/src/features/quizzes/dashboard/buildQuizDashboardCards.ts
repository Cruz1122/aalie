import type { QuizDashboardMetrics } from "./quizDashboardTypes";
import type { StoredQuizAttempt } from "../storage/quizStorageTypes";

export type QuizDashboardCardModel =
  | {
      kind: "start";
      title: string;
      description: string;
      eyebrow: string;
      progressValue: number | null;
      progressLabel: string;
      ctaLabel: string;
    }
  | {
      kind: "average";
      title: string;
      description: string;
      eyebrow: string;
      progressValue: number | null;
      progressLabel: string;
      ctaLabel: string;
    }
  | {
      kind: "weakness";
      title: string;
      description: string;
      eyebrow: string;
      progressValue: number | null;
      progressLabel: string;
      ctaLabel: string;
    }
  | {
      kind: "recent";
      title: string;
      description: string;
      eyebrow: string;
      progressValue: number | null;
      progressLabel: string;
      ctaLabel: string;
    }
  | {
      kind: "strength";
      title: string;
      description: string;
      eyebrow: string;
      progressValue: number | null;
      progressLabel: string;
      ctaLabel: string;
    }
  | {
      kind: "empty";
      title: string;
      description: string;
      eyebrow: string;
      progressValue: null;
      progressLabel: string;
      ctaLabel: string;
    };

interface BuildQuizDashboardCardsArgs {
  metrics: QuizDashboardMetrics;
  attempts: StoredQuizAttempt[];
  i18n: {
    newTestEyebrow: string;
    firstQuizTitle: string;
    firstQuizDescription: string;
    noHistoryProgress: string;
    firstQuizCta: string;
    emptyStateEyebrow: string;
    noStatsTitle: string;
    noStatsDescription: string;
    pendingProgress: string;
    diagnosticCta: string;
    recommendedPracticeEyebrow: string;
    practiceAreaTitle: (area: string) => string;
    topicLabel: (topicId: string) => string;
    newQuizTitle: string;
    recommendedPracticeDescription: string;
    adaptiveDescription: string;
    currentAverageProgress: string;
    startQuizCta: string;
    averageEyebrow: string;
    averageUnavailableTitle: string;
    averageTitle: (score: string) => string;
    averageDescription: string;
    averageAccuracyProgress: string;
    viewHistoryCta: string;
    weaknessEyebrow: string;
    noCriticalWeaknessTitle: string;
    weaknessDescription: string;
    noWeaknessDescription: string;
    masteryProgress: string;
    practiceAreaCta: string;
    generalTestCta: string;
    latestTestEyebrow: string;
    latestTitle: (percent: number) => string;
    noLatestTitle: string;
    latestDescription: (correct: number, total: number) => string;
    noLatestDescription: string;
    resultProgress: string;
    retryCta: string;
    strengthEyebrow: string;
    pendingStrengthTitle: string;
    strengthDescription: string;
    noStrengthDescription: string;
    keepPracticingCta: string;
  };
}

function percent(value: number | null | undefined): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function gradeOverFive(value: number): string {
  const grade = (Math.round(value * 50) / 10).toFixed(1);
  return `${grade}/5.0`;
}

export function buildQuizDashboardCards({
  metrics,
  attempts,
  i18n,
}: BuildQuizDashboardCardsArgs): QuizDashboardCardModel[] {
  const hasAttempts = metrics.totalAttempts > 0;
  const latestAttempt = attempts[0] ?? null;
  const averagePercent = percent(metrics.averageAccuracy);
  const averageScore =
    typeof metrics.averageAccuracy === "number" &&
    Number.isFinite(metrics.averageAccuracy)
      ? (Math.round(metrics.averageAccuracy * 50) / 10).toFixed(1)
      : null;

  if (!hasAttempts) {
    return [
      {
        kind: "start",
        eyebrow: i18n.newTestEyebrow,
        title: i18n.firstQuizTitle,
        description: i18n.firstQuizDescription,
        progressValue: null,
        progressLabel: i18n.noHistoryProgress,
        ctaLabel: i18n.firstQuizCta,
      },
      {
        kind: "empty",
        eyebrow: i18n.emptyStateEyebrow,
        title: i18n.noStatsTitle,
        description: i18n.noStatsDescription,
        progressValue: null,
        progressLabel: i18n.pendingProgress,
        ctaLabel: i18n.diagnosticCta,
      },
    ];
  }

  const primaryWeakness = metrics.topAreasToImprove[0];
  const primaryStrength = metrics.topStrengths[0];
  const weaknessLabel = primaryWeakness
    ? i18n.topicLabel(primaryWeakness)
    : null;
  const strengthLabel = primaryStrength
    ? i18n.topicLabel(primaryStrength)
    : null;

  return [
    {
      kind: "start",
      eyebrow: i18n.recommendedPracticeEyebrow,
      title: weaknessLabel ?? i18n.newQuizTitle,
      description: primaryWeakness
        ? i18n.recommendedPracticeDescription
        : i18n.adaptiveDescription,
      progressValue: averagePercent,
      progressLabel: i18n.currentAverageProgress,
      ctaLabel: i18n.startQuizCta,
    },
    {
      kind: "average",
      eyebrow: i18n.averageEyebrow,
      title:
        averageScore === null
          ? i18n.averageUnavailableTitle
          : i18n.averageTitle(averageScore),
      description: i18n.averageDescription,
      progressValue: averagePercent,
      progressLabel: i18n.averageAccuracyProgress,
      ctaLabel: i18n.viewHistoryCta,
    },
    {
      kind: "weakness",
      eyebrow: i18n.weaknessEyebrow,
      title: weaknessLabel ?? i18n.noCriticalWeaknessTitle,
      description: primaryWeakness
        ? i18n.weaknessDescription
        : i18n.noWeaknessDescription,
      progressValue: null,
      progressLabel: i18n.masteryProgress,
      ctaLabel: primaryWeakness ? i18n.practiceAreaCta : i18n.generalTestCta,
    },
    {
      kind: "recent",
      eyebrow: i18n.latestTestEyebrow,
      title: latestAttempt
        ? gradeOverFive(latestAttempt.accuracy)
        : i18n.noLatestTitle,
      description: latestAttempt
        ? i18n.latestDescription(
            Math.round(latestAttempt.score),
            Math.round(latestAttempt.maxScore),
          )
        : i18n.noLatestDescription,
      progressValue: latestAttempt ? percent(latestAttempt.accuracy) : null,
      progressLabel: i18n.resultProgress,
      ctaLabel: i18n.retryCta,
    },
    {
      kind: "strength",
      eyebrow: i18n.strengthEyebrow,
      title: strengthLabel ?? i18n.pendingStrengthTitle,
      description: primaryStrength
        ? i18n.strengthDescription
        : i18n.noStrengthDescription,
      progressValue: null,
      progressLabel: i18n.masteryProgress,
      ctaLabel: i18n.keepPracticingCta,
    },
  ];
}
