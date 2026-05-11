"use client";

import { useCallback, useEffect, useState } from "react";

import { deriveQuizDashboardMetrics } from "./deriveQuizDashboard";
import type { QuizDashboardMetrics } from "./quizDashboardTypes";
import { loadAttempts } from "../storage/quizAttemptStorage";
import { loadQuizProgress } from "../storage/quizProgressStorage";
import type {
  StoredQuizAttempt,
  StoredQuizProgress,
} from "../storage/quizStorageTypes";

export interface QuizDashboardState {
  metrics: QuizDashboardMetrics;
  progress: StoredQuizProgress | null;
  attempts: StoredQuizAttempt[];
  isLoaded: boolean;
  reload: () => void;
}

export function useQuizDashboard(): QuizDashboardState {
  const [state, setState] = useState<QuizDashboardState>({
    metrics: {
      totalAttempts: 0,
      averageAccuracy: 0,
      recentAttempts: [],
      topStrengths: [],
      topAreasToImprove: [],
    },
    progress: null,
    attempts: [],
    isLoaded: false,
    reload: () => {},
  });

  const reload = useCallback(() => {
    const attempts = loadAttempts();
    const progress = loadQuizProgress();
    const metrics = deriveQuizDashboardMetrics(attempts, progress);
    setState((prev) => ({
      ...prev,
      metrics,
      progress,
      attempts,
      isLoaded: true,
    }));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
