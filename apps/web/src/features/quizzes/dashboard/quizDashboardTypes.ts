import type { StoredQuizAttempt } from "../storage/quizStorageTypes";

export interface QuizDashboardMetrics {
  totalAttempts: number;
  averageAccuracy: number;
  recentAttempts: StoredQuizAttempt[];
  topStrengths: string[];
  topAreasToImprove: string[];
}

export interface StartQuizOptions {
  moduleId?: string;
  /** Título del módulo (p. ej. desde la card del curso) para mostrar alcance del quiz */
  moduleTitle?: string;
  topicIds?: string[];
  skillIds?: string[];
  questionCount?: number;
}
