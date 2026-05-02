import type { ContentRef, RenderableContent } from "./content";

export type QuizQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "ordering"
  | "match_pairs";

export type QuizDifficulty = "basic" | "intermediate" | "advanced";

export type QuizCognitiveLevel =
  | "recall"
  | "understand"
  | "apply"
  | "analyze";

export type QuizQuestionStatus =
  | "draft"
  | "active"
  | "deprecated"
  | "archived";

export type QuizGradingMode =
  | "all_or_nothing"
  | "exact_set"
  | "partial_credit"
  | "ordered_exact"
  | "pairwise";

export interface QuizOptionFeedback {
  blocks: RenderableContent["blocks"];
  contentRefs?: ContentRef[];
}

export interface QuizOption {
  optionId: string;
  content: RenderableContent;
  feedback: QuizOptionFeedback;
}

export interface QuizMatchItem {
  leftId?: string;
  rightId?: string;
  content: RenderableContent;
}

export interface QuizPair {
  leftId: string;
  rightId: string;
}

export interface QuizAnswer {
  correctOptionIds?: string[];
  orderedOptionIds?: string[];
  pairs?: QuizPair[];
}

export interface QuizGradingPolicy {
  mode: QuizGradingMode;
  maxScore: number;
  penalty?: number;
  minScore?: number;
}

export interface SelectionMeta {
  weight?: number;
  estimatedTimeSec?: number;
  targetMastery?: number;
  prerequisiteSkillIds?: string[];
  reinforcesSkillIds?: string[];
  exposureLimit?: number;
  cooldownSessions?: number;
  discrimination?: "low" | "medium" | "high";
}

export interface QuizQuestion {
  questionId: string;
  questionVersion: number;
  status: QuizQuestionStatus;
  type: QuizQuestionType;
  difficulty: QuizDifficulty;
  cognitiveLevel: QuizCognitiveLevel;
  topic: string;
  tags: string[];
  skillIds: string[];
  prompt: RenderableContent;
  options?: QuizOption[];
  leftItems?: Array<Required<Pick<QuizMatchItem, "leftId">> & QuizMatchItem>;
  rightItems?: Array<Required<Pick<QuizMatchItem, "rightId">> & QuizMatchItem>;
  answer: QuizAnswer;
  gradingPolicy: QuizGradingPolicy;
  explanation: RenderableContent;
  contentRefs: ContentRef[];
  selectionMeta: SelectionMeta;
}

export interface QuizDataset {
  schemaVersion: string;
  datasetId: string;
  locale: string;
  courseId: string;
  taxonomyVersion: string;
  questions: QuizQuestion[];
}

export interface QuizSessionPreferences {
  questionCount?: number;
  difficultyMix?: Partial<Record<QuizDifficulty, number>>;
  moduleId?: string;
  topicIds?: string[];
  skillIds?: string[];
}

export interface QuizRecentResult {
  questionId: string;
  topic: string;
  difficulty: QuizDifficulty;
  type: QuizQuestionType;
  wasCorrect: boolean;
  score?: number;
}

export interface QuizSelectionRequest {
  studentId?: string | null;
  studiedContentRefs: ContentRef[];
  masteryBySkill: Record<string, number>;
  weakSkillIds: string[];
  weakTopics?: string[];
  recentResults?: QuizRecentResult[];
  recentQuestionIds: string[];
  sessionPreferences?: QuizSessionPreferences;
  /** Banco de preguntas: coincide con next-intl (ej. `en`, `es`). */
  locale?: string | null;
}

export interface QuizSession {
  sessionId: string;
  schemaVersion: string;
  locale: string;
  courseId: string;
  questions: QuizQuestion[];
  metadata: {
    selectionMode: "adaptive_deterministic";
    warnings: string[];
  };
}

export interface QuizSelectionReason {
  code:
    | "initial_question"
    | "reinforce_failed_topic"
    | "increase_difficulty"
    | "decrease_difficulty"
    | "maintain_difficulty"
    | "cover_pending_topic"
    | "avoid_repetition"
    | "fallback_available_question";
  message: string;
  topic?: string;
  difficulty?: QuizDifficulty;
}

export type QuizAttempt = QuizSession;

export type StudentAnswer =
  | {
      questionId: string;
      selectedOptionIds: string[];
    }
  | {
      questionId: string;
      orderedOptionIds: string[];
    }
  | {
      questionId: string;
      pairs: QuizPair[];
    };

export interface QuizQuestionResult {
  questionId: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  studentAnswer: StudentAnswer;
  correctAnswer?: QuizAnswer;
  optionFeedback: QuizOptionFeedback[];
  explanation: RenderableContent;
  contentRefs: ContentRef[];
  skillIds: string[];
}

export interface QuizSessionEvaluateRequest {
  sessionId: string;
  questionIds: string[];
  answers: StudentAnswer[];
  /** Mismo locale que la sesión (p. ej. `session.locale`). */
  locale?: string | null;
}

export interface QuizAnswerSubmission extends QuizSessionEvaluateRequest {}

export interface QuizSessionResult {
  sessionId: string;
  score: number;
  maxScore: number;
  accuracy: number;
  results: QuizQuestionResult[];
  areasToImprove: string[];
  strengths: string[];
  masteryDeltaBySkill: Record<string, number>;
}

export type QuizAttemptResult = QuizSessionResult;
