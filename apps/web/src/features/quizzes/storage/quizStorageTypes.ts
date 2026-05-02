import type { QuizDifficulty } from "@aa/types";

export interface QuizAttemptAreaStats {
  accuracy: number;
  total: number;
}

export interface QuizAttemptDifficultyStats {
  accuracy: number;
  total: number;
}

export interface StoredQuizAttempt {
  attemptId: string;
  timestamp: number;
  moduleId?: string;
  moduleTitle?: string;
  score: number;
  maxScore: number;
  accuracy: number;
  areasToImprove: string[];
  strengths: string[];
  topicStats: Record<string, QuizAttemptAreaStats>;
  skillStats: Record<string, QuizAttemptAreaStats>;
  difficultyStats: Record<QuizDifficulty, QuizAttemptDifficultyStats>;
}

export interface StoredQuizProgress {
  masteryBySkill: Record<string, number>;
  recentQuestionIds: string[];
  weakSkillIds: string[];
  lastFailedSkillIds: string[];
  lastFailedTopicIds: string[];
  updatedAt: number;
}
