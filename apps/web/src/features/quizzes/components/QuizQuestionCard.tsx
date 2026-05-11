"use client";

import type {
  QuizPair,
  QuizQuestion,
  QuizQuestionResult,
  QuizSessionResult,
  StudentAnswer,
} from "@aa/types";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import AALIEEmotionIcon, {
  type AALIEEmotionIconName,
} from "@/components/AALIEEmotionIcon";
import RenderableContent from "@/components/content/RenderableContent";
import type { QuizOptionState } from "@/features/quizzes/components/types";
import { Link } from "@/i18n/navigation";
import { getCourseChapterHrefFromContentRef } from "@/lib/content/resolveCourseContentRef";

import { DefinitionsConceptsQuestion } from "./DefinitionsConceptsQuestion";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { OrderingQuestion } from "./OrderingQuestion";
import { QuizErrorState } from "./QuizErrorState";
import {
  buildMatchRowStateByLeftId,
  buildOrderingStateById,
} from "./quizOptionSurface";
import { QuizQuestionMeta } from "./QuizQuestionMeta";
import { SingleChoiceQuestion } from "./SingleChoiceQuestion";
import { TrueFalseQuestion } from "./TrueFalseQuestion";

interface ResponseState {
  selectedOptionIds?: string[];
  orderedOptionIds?: string[];
  pairs?: Array<{ leftId: string; rightId: string }>;
}

interface QuizQuestionCardProps {
  question: QuizQuestion;
  index: number;
  value: ResponseState;
  onChange: (next: ResponseState) => void;
}

interface QuizQuestionReviewCardProps {
  question: QuizQuestion;
  result: QuizQuestionResult;
  index: number;
}

function pickVariant(seed: string, variants: string[]): string {
  if (variants.length === 0) return "";
  const hash = Array.from(seed).reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) % 2147483647,
    7,
  );
  return variants[Math.abs(hash) % variants.length] ?? variants[0] ?? "";
}

const DIFFICULTY_CLASSNAMES = {
  basic: "border-emerald-500/30 bg-emerald-500/12 text-emerald-200",
  intermediate: "border-amber-500/30 bg-amber-500/12 text-amber-200",
  advanced: "border-rose-500/30 bg-rose-500/12 text-rose-200",
} as const;

function getSelectedOptionIds(answer: StudentAnswer): string[] {
  if ("selectedOptionIds" in answer) {
    return answer.selectedOptionIds;
  }
  return [];
}

function getOrderedOptionIds(
  question: QuizQuestion,
  answer: StudentAnswer,
): string[] {
  if ("orderedOptionIds" in answer) {
    return answer.orderedOptionIds;
  }
  return (question.options ?? []).map((item) => item.optionId);
}

function getPairs(answer: StudentAnswer): QuizPair[] {
  if ("pairs" in answer) {
    return answer.pairs;
  }
  return [];
}

function isPartiallyCorrectSelection(
  selected: Set<string>,
  correct: Set<string>,
): boolean {
  if (selected.size === 0 || correct.size === 0) return false;

  const selectedCorrectCount = Array.from(selected).filter((id) =>
    correct.has(id),
  ).length;

  const hasSomeCorrect = selectedCorrectCount > 0;
  const hasAllCorrect =
    selected.size === correct.size && selectedCorrectCount === correct.size;

  return hasSomeCorrect && !hasAllCorrect;
}

function buildOptionStateById(
  question: QuizQuestion,
  result: QuizQuestionResult,
): Record<string, QuizOptionState> {
  const selected = new Set(getSelectedOptionIds(result.studentAnswer));
  const correct = new Set(result.correctAnswer?.correctOptionIds ?? []);
  const stateById: Record<string, QuizOptionState> = {};

  const isMultiple = question.type === "multiple_choice";
  const isPartial =
    isMultiple && isPartiallyCorrectSelection(selected, correct);

  for (const option of question.options ?? []) {
    const isSelected = selected.has(option.optionId);
    const isCorrect = correct.has(option.optionId);

    if (isSelected && isCorrect) {
      if (result.isCorrect) {
        stateById[option.optionId] = "correct";
      } else if (isPartial) {
        stateById[option.optionId] = "partial";
      } else {
        stateById[option.optionId] = "correct";
      }
      continue;
    }
    if (isSelected && !isCorrect) {
      stateById[option.optionId] = "incorrect";
      continue;
    }
    if (!isSelected && isCorrect) {
      stateById[option.optionId] = "revealed";
      continue;
    }
    stateById[option.optionId] = "idle";
  }

  return stateById;
}

function QuestionCardShell({
  question,
  index,
  children,
}: {
  question: QuizQuestion;
  index: number;
  children: ReactNode;
}) {
  const t = useTranslations("quizzes");
  return (
    <article className="glass-card quiz-no-hover relative flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-[rgba(24,36,49,0.94)] p-4 sm:p-5">
      <span
        className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs sm:right-4 sm:top-4 ${DIFFICULTY_CLASSNAMES[question.difficulty]}`}
      >
        {t(`meta.difficulty.${question.difficulty}`)}
      </span>
      <QuizQuestionMeta topic={question.topic} current={index + 1} />
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-custom">
        <RenderableContent content={question.prompt} className="mb-4" />
        {children}
      </div>
    </article>
  );
}

export function QuizQuestionCard({
  question,
  index,
  value,
  onChange,
}: QuizQuestionCardProps) {
  const t = useTranslations("quizzes");
  const supported =
    question.type === "single_choice" ||
    question.type === "multiple_choice" ||
    question.type === "true_false" ||
    question.type === "ordering" ||
    question.type === "match_pairs";

  return (
    <QuestionCardShell question={question} index={index}>
      {question.type === "single_choice" ? (
        <SingleChoiceQuestion
          question={question}
          value={value.selectedOptionIds?.[0]}
          onChange={(selected) => onChange({ selectedOptionIds: [selected] })}
        />
      ) : null}

      {question.type === "multiple_choice" ? (
        <MultipleChoiceQuestion
          question={question}
          value={value.selectedOptionIds ?? []}
          onChange={(selected) => onChange({ selectedOptionIds: selected })}
        />
      ) : null}

      {question.type === "true_false" ? (
        <TrueFalseQuestion
          question={question}
          value={value.selectedOptionIds?.[0]}
          onChange={(selected) => onChange({ selectedOptionIds: [selected] })}
        />
      ) : null}

      {question.type === "ordering" ? (
        <OrderingQuestion
          question={question}
          value={value.orderedOptionIds ?? []}
          onChange={(ordered) => onChange({ orderedOptionIds: ordered })}
        />
      ) : null}

      {question.type === "match_pairs" ? (
        <DefinitionsConceptsQuestion
          question={question}
          value={value.pairs ?? []}
          onChange={(pairs) => onChange({ pairs })}
        />
      ) : null}

      {!supported ? (
        <QuizErrorState message={t("error.unsupportedQuestion")} />
      ) : null}
    </QuestionCardShell>
  );
}

export function QuizQuestionReviewCard({
  question,
  result,
  index,
}: QuizQuestionReviewCardProps) {
  const t = useTranslations("quizzes");
  const topicLabel = (() => {
    try {
      return t(`topics.${question.topic}` as Parameters<typeof t>[0]);
    } catch {
      return question.topic;
    }
  })();
  const reviewVariants = result.isCorrect
    ? [
        t("result.goToContentGood1"),
        t("result.goToContentGood2"),
        t("result.goToContentGood3"),
        t("result.goToContentGood4"),
      ]
    : [
        t("result.goToContentRetry1"),
        t("result.goToContentRetry2"),
        t("result.goToContentRetry3"),
        t("result.goToContentRetry4"),
      ];
  const reviewCtaPrefix = pickVariant(
    `${question.questionId}-${result.isCorrect ? "ok" : "retry"}`,
    reviewVariants,
  );
  const stateById = buildOptionStateById(question, result);
  const orderingStateById = buildOrderingStateById(question, result);
  const matchRowStateByLeftId = buildMatchRowStateByLeftId(question, result);

  return (
    <QuestionCardShell question={question} index={index}>
      {question.type === "single_choice" ? (
        <SingleChoiceQuestion
          question={question}
          value={getSelectedOptionIds(result.studentAnswer)[0]}
          onChange={() => undefined}
          disabled
          showFeedback
          stateById={stateById}
        />
      ) : null}

      {question.type === "multiple_choice" ? (
        <MultipleChoiceQuestion
          question={question}
          value={getSelectedOptionIds(result.studentAnswer)}
          onChange={() => undefined}
          disabled
          showFeedback
          stateById={stateById}
        />
      ) : null}

      {question.type === "true_false" ? (
        <TrueFalseQuestion
          question={question}
          value={getSelectedOptionIds(result.studentAnswer)[0]}
          onChange={() => undefined}
          disabled
          showFeedback
          stateById={stateById}
        />
      ) : null}

      {question.type === "ordering" ? (
        <OrderingQuestion
          question={question}
          value={getOrderedOptionIds(question, result.studentAnswer)}
          onChange={() => undefined}
          disabled
          optionStateById={orderingStateById}
        />
      ) : null}

      {question.type === "match_pairs" ? (
        <DefinitionsConceptsQuestion
          question={question}
          value={getPairs(result.studentAnswer)}
          onChange={() => undefined}
          disabled
          rowStateByLeftId={matchRowStateByLeftId}
        />
      ) : null}

      {result.explanation.blocks.length > 0 ? (
        <div className="mt-3 text-[11px] italic leading-relaxed text-slate-400">
          <RenderableContent
            content={result.explanation}
            className="[&>*]:mb-0 text-[11px] italic leading-relaxed text-slate-400"
          />
        </div>
      ) : null}

      {result.contentRefs.length > 0 ? (
        <div className="mt-3 text-xs">
          {result.contentRefs.map((ref, idx) => {
            const href = getCourseChapterHrefFromContentRef(ref);
            if (!href) {
              return null;
            }

            return (
              <Link
                key={`${ref.moduleId}-${ref.chapterId}-${idx}`}
                className="mr-2 inline-flex items-center rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-500/20 hover:text-cyan-100"
                href={href}
              >
                {t("result.goToContentNatural", {
                  prompt: reviewCtaPrefix,
                  topic: topicLabel,
                })}
              </Link>
            );
          })}
        </div>
      ) : null}
    </QuestionCardShell>
  );
}

export function QuizResultView({ result }: { result: QuizSessionResult }) {
  const t = useTranslations("quizzes");
  const correctCount = result.results.filter((item) => item.isCorrect).length;
  const incorrectCount = result.results.filter(
    (item) => !item.isCorrect,
  ).length;
  const accuracy = result.accuracy;
  const gradeOutOfFive =
    result.maxScore > 0 ? (result.score / result.maxScore) * 5 : 0;

  const emotionName: AALIEEmotionIconName =
    accuracy >= 0.85
      ? "happy"
      : accuracy >= 0.65
        ? "satisfied"
        : accuracy >= 0.45
          ? "neutral"
          : "worried";

  const iconColor =
    accuracy >= 0.85
      ? "text-emerald-300"
      : accuracy >= 0.65
        ? "text-sky-300"
        : accuracy >= 0.45
          ? "text-amber-300"
          : "text-rose-300";
  const headlineKey =
    accuracy >= 0.85
      ? "result.headlineExcellent"
      : accuracy >= 0.65
        ? "result.headlineGreat"
        : accuracy >= 0.45
          ? "result.headlineClose"
          : "result.headlineKeepGoing";
  const toneClass =
    accuracy >= 0.85
      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
      : accuracy >= 0.65
        ? "border-sky-400/35 bg-sky-500/10 text-sky-300"
        : accuracy >= 0.45
          ? "border-amber-400/35 bg-amber-500/10 text-amber-300"
          : "border-rose-400/35 bg-rose-500/10 text-rose-300";
  const formattedAreas = result.areasToImprove.map((area) => {
    // Skill IDs (e.g., 'skill.asymptotic.big_o.upper-bound-interpretation')
    // are mapped directly to nested keys under the 'quizzes' namespace.
    try {
      return t(area as Parameters<typeof t>[0]);
    } catch {
      return area;
    }
  });
  const topicsText = formattedAreas.join(", ");

  return (
    <div className="scrollbar-custom h-full min-h-0 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-xl items-center py-2">
        <div className="w-full text-center">
          <AALIEEmotionIcon
            name={emotionName}
            size={104}
            className={`${iconColor} mb-2`}
          />
          <h2 className={`mt-3 text-2xl font-bold ${iconColor}`}>
            {gradeOutOfFive.toFixed(1)} / 5.0
          </h2>
          <div
            className={`glass-card quiz-no-hover mt-3 rounded-lg border px-3 py-2 text-sm font-medium ${toneClass}`}
          >
            {t(headlineKey)}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-2">
              <p className="text-[11px] text-emerald-200/90">
                {t("result.correct")}
              </p>
              <p className="text-lg font-semibold text-emerald-100">
                {correctCount}
              </p>
            </div>
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-2">
              <p className="text-[11px] text-rose-200/90">
                {t("result.incorrect")}
              </p>
              <p className="text-lg font-semibold text-rose-100">
                {incorrectCount}
              </p>
            </div>
          </div>

          {formattedAreas.length > 0 ? (
            <p className="mt-4 text-xs text-slate-300">
              {formattedAreas.length === 1
                ? t("result.areasIntroSingle", { topics: topicsText })
                : t("result.areasIntroMany", { topics: topicsText })}
            </p>
          ) : (
            <p className="mt-4 text-xs font-semibold text-emerald-300">
              {t("result.noAreasCongrats")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
