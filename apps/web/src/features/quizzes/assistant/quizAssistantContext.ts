import type {
  QuizQuestion,
  QuizQuestionResult,
  QuizSessionResult,
  RenderableContent,
  StudentAnswer,
} from "@aa/types";

import type {
  AssistantQuizDashboardContext,
  AssistantQuizRecentAttemptContext,
  AssistantQuizReviewQuestionContext,
  AssistantQuizSessionReviewContext,
} from "@/lib/assistant/types";

import type { QuizDashboardMetrics } from "../dashboard/quizDashboardTypes";
import type { StoredQuizProgress } from "../storage/quizStorageTypes";

const PLAIN_BLOCK_JOIN = "\n\n";

export function renderableToPlainText(
  content: RenderableContent | undefined,
  maxChars: number,
): string {
  if (!content?.blocks?.length) {
    return "";
  }
  const parts: string[] = [];
  for (const block of content.blocks) {
    if (block.type === "markdown") {
      parts.push(block.content.trim());
    } else {
      parts.push(`[${block.language}]\n${block.content.trim()}`);
    }
  }
  const joined = parts.join(PLAIN_BLOCK_JOIN).replace(/\s+/g, " ").trim();
  if (joined.length <= maxChars) {
    return joined;
  }
  return `${joined.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function optionLabelById(
  question: QuizQuestion,
  optionId: string,
  maxPerOption: number,
): string {
  const opt = question.options?.find((o) => o.optionId === optionId);
  if (!opt) {
    return optionId;
  }
  return renderableToPlainText(opt.content, maxPerOption);
}

function formatStudentAnswerSummary(
  question: QuizQuestion,
  answer: StudentAnswer,
  maxLen: number,
): string {
  if (
    "selectedOptionIds" in answer &&
    answer.selectedOptionIds &&
    answer.selectedOptionIds.length > 0
  ) {
    const labels = answer.selectedOptionIds.map((id) =>
      optionLabelById(question, id, 120),
    );
    const s = labels.join(" | ");
    return s.length <= maxLen ? s : `${s.slice(0, maxLen - 1)}…`;
  }
  if (
    "orderedOptionIds" in answer &&
    answer.orderedOptionIds &&
    answer.orderedOptionIds.length > 0
  ) {
    const labels = answer.orderedOptionIds.map((id, i) => {
      const label = optionLabelById(question, id, 100);
      return `${i + 1}. ${label}`;
    });
    const s = labels.join("; ");
    return s.length <= maxLen ? s : `${s.slice(0, maxLen - 1)}…`;
  }
  if ("pairs" in answer && answer.pairs && answer.pairs.length > 0) {
    const lines = answer.pairs.map((pair) => {
      const leftItem = question.leftItems?.find(
        (l) => l.leftId === pair.leftId,
      );
      const rightItem = question.rightItems?.find(
        (r) => r.rightId === pair.rightId,
      );
      const lt = leftItem?.content
        ? renderableToPlainText(leftItem.content, 80)
        : pair.leftId;
      const rt = rightItem?.content
        ? renderableToPlainText(rightItem.content, 80)
        : pair.rightId;
      return `${lt} -> ${rt}`;
    });
    const s = lines.join("; ");
    return s.length <= maxLen ? s : `${s.slice(0, maxLen - 1)}…`;
  }
  return "";
}

function formatCorrectAnswerSummary(
  question: QuizQuestion,
  correct: QuizQuestionResult["correctAnswer"],
  maxLen: number,
): string | undefined {
  if (!correct) {
    return undefined;
  }
  if (correct.correctOptionIds?.length) {
    const labels = correct.correctOptionIds.map((id) =>
      optionLabelById(question, id, 120),
    );
    const s = labels.join(" | ");
    return s.length <= maxLen ? s : `${s.slice(0, maxLen - 1)}…`;
  }
  if (correct.orderedOptionIds?.length) {
    const labels = correct.orderedOptionIds.map((id, i) => {
      const label = optionLabelById(question, id, 100);
      return `${i + 1}. ${label}`;
    });
    const joined = labels.join("; ");
    return joined.length <= maxLen ? joined : `${joined.slice(0, maxLen - 1)}…`;
  }
  if (correct.pairs?.length) {
    const lines = correct.pairs.map((pair) => {
      const leftItem = question.leftItems?.find(
        (l) => l.leftId === pair.leftId,
      );
      const rightItem = question.rightItems?.find(
        (r) => r.rightId === pair.rightId,
      );
      const lt = leftItem?.content
        ? renderableToPlainText(leftItem.content, 80)
        : pair.leftId;
      const rt = rightItem?.content
        ? renderableToPlainText(rightItem.content, 80)
        : pair.rightId;
      return `${lt} -> ${rt}`;
    });
    const s = lines.join("; ");
    return s.length <= maxLen ? s : `${s.slice(0, maxLen - 1)}…`;
  }
  return undefined;
}

function formatOptionFeedbackSummaries(
  question: QuizQuestion,
  result: QuizQuestionResult,
  maxItems: number,
  maxEach: number,
): string[] | undefined {
  const opts = question.options;
  if (!opts?.length || !result.optionFeedback?.length) {
    return undefined;
  }
  const out: string[] = [];
  const n = Math.min(opts.length, result.optionFeedback.length, maxItems);
  for (let i = 0; i < n; i += 1) {
    const fb = result.optionFeedback[i];
    if (!fb?.blocks?.length) {
      continue;
    }
    const label = optionLabelById(question, opts[i]!.optionId, 80);
    const body = renderableToPlainText({ blocks: fb.blocks }, maxEach);
    if (body) {
      out.push(`${label}: ${body}`);
    }
  }
  return out.length > 0 ? out : undefined;
}

function buildReviewQuestionContext(
  question: QuizQuestion,
  result: QuizQuestionResult,
  index: number,
  formatTopicId: (topicId: string) => string,
): AssistantQuizReviewQuestionContext {
  const topicLabel = formatTopicId(question.topic);
  return {
    index,
    questionId: result.questionId,
    questionType: question.type,
    topic: topicLabel,
    difficulty: question.difficulty,
    promptSummary: renderableToPlainText(question.prompt, 900),
    isCorrect: result.isCorrect,
    score: result.score,
    maxScore: result.maxScore,
    userAnswerSummary: formatStudentAnswerSummary(
      question,
      result.studentAnswer,
      500,
    ),
    correctAnswerSummary: formatCorrectAnswerSummary(
      question,
      result.correctAnswer,
      500,
    ),
    explanationSummary: renderableToPlainText(result.explanation, 1200),
    optionFeedbackSummaries: formatOptionFeedbackSummaries(
      question,
      result,
      8,
      320,
    ),
    skillIds: result.skillIds?.length ? result.skillIds : undefined,
  };
}

export function buildAssistantQuizDashboardContext(input: {
  metrics: QuizDashboardMetrics;
  progress: StoredQuizProgress | null;
  formatTopicId: (topicId: string) => string;
}): AssistantQuizDashboardContext {
  const { metrics, progress, formatTopicId } = input;
  const areas = (metrics.topAreasToImprove ?? []).map(formatTopicId);
  const strengths = (metrics.topStrengths ?? []).map(formatTopicId);
  const recent: AssistantQuizRecentAttemptContext[] = (
    metrics.recentAttempts ?? []
  ).map((att) => ({
    attemptId: att.attemptId,
    completedAt: att.timestamp,
    moduleId: att.moduleId,
    moduleTitle: att.moduleTitle,
    accuracy: att.accuracy,
    score: att.score,
    maxScore: att.maxScore,
    topicHighlights: (att.strengths ?? []).slice(0, 4).map(formatTopicId),
    areasToImprove: (att.areasToImprove ?? []).slice(0, 4).map(formatTopicId),
  }));

  return {
    areasToImprove: areas,
    strengths,
    weakSkillIds: progress?.weakSkillIds ?? [],
    lastFailedTopicIds: (progress?.lastFailedTopicIds ?? []).map(formatTopicId),
    recentAttempts: recent,
  };
}

export function buildAssistantQuizSessionReviewContext(input: {
  result: QuizSessionResult;
  questions: QuizQuestion[];
  reviewIndex: number;
  reviewTotal: number;
  isSummaryStep: boolean;
  formatTopicId: (topicId: string) => string;
}): AssistantQuizSessionReviewContext {
  const {
    result,
    questions,
    reviewIndex,
    reviewTotal,
    isSummaryStep,
    formatTopicId,
  } = input;

  const byId = new Map(questions.map((q) => [q.questionId, q]));

  const allQuestions: AssistantQuizReviewQuestionContext[] = result.results.map(
    (qr, idx) => {
      const q = byId.get(qr.questionId);
      if (!q) {
        return {
          index: idx,
          questionId: qr.questionId,
          questionType: "unknown",
          promptSummary: "",
          isCorrect: qr.isCorrect,
          score: qr.score,
          maxScore: qr.maxScore,
          userAnswerSummary: "",
          explanationSummary: renderableToPlainText(qr.explanation, 800),
        };
      }
      return buildReviewQuestionContext(q, qr, idx, formatTopicId);
    },
  );

  let currentQuestion: AssistantQuizReviewQuestionContext | undefined;
  if (!isSummaryStep && reviewIndex > 0) {
    const qr = result.results[reviewIndex - 1];
    if (qr) {
      const q = byId.get(qr.questionId);
      currentQuestion = q
        ? buildReviewQuestionContext(q, qr, reviewIndex - 1, formatTopicId)
        : allQuestions[reviewIndex - 1];
    }
  }

  return {
    view: isSummaryStep ? "summary" : "question-review",
    reviewStepIndex: reviewIndex,
    reviewStepTotal: reviewTotal,
    sessionId: result.sessionId,
    overallAccuracy: result.accuracy,
    overallScore: result.score,
    overallMaxScore: result.maxScore,
    areasToImprove: (result.areasToImprove ?? []).map(formatTopicId),
    strengths: (result.strengths ?? []).map(formatTopicId),
    currentQuestion,
    allQuestions,
  };
}
