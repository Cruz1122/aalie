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

import RenderableContent from "@/components/content/RenderableContent";
import type { QuizOptionState } from "@/features/quizzes/components/types";

import { DefinitionsConceptsQuestion } from "./DefinitionsConceptsQuestion";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { OrderingQuestion } from "./OrderingQuestion";
import { QuizErrorState } from "./QuizErrorState";
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

function buildOptionStateById(
  question: QuizQuestion,
  result: QuizQuestionResult,
): Record<string, QuizOptionState> {
  const selected = new Set(getSelectedOptionIds(result.studentAnswer));
  const correct = new Set(result.correctAnswer?.correctOptionIds ?? []);
  const stateById: Record<string, QuizOptionState> = {};

  for (const option of question.options ?? []) {
    const isSelected = selected.has(option.optionId);
    const isCorrect = correct.has(option.optionId);
    if (isSelected && isCorrect) {
      stateById[option.optionId] = "correct";
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
        className={`absolute right-4 top-4 rounded-full border px-2.5 py-1 text-xs ${DIFFICULTY_CLASSNAMES[question.difficulty]}`}
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
  const stateById = buildOptionStateById(question, result);

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
        />
      ) : null}

      {question.type === "match_pairs" ? (
        <DefinitionsConceptsQuestion
          question={question}
          value={getPairs(result.studentAnswer)}
          onChange={() => undefined}
          disabled
        />
      ) : null}

      {result.explanation.blocks.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-400">
            {t("result.explanation")}
          </p>
          <RenderableContent
            content={result.explanation}
            className="mt-1 text-xs text-slate-400"
          />
        </div>
      ) : null}

      {result.contentRefs.length > 0 ? (
        <div className="mt-2 text-xs">
          {result.contentRefs.map((ref, idx) => (
            <a
              key={`${ref.moduleId}-${ref.chapterId}-${idx}`}
              className="mr-2 text-cyan-300 underline"
              href={`/es/course#${ref.blockId ?? ref.chapterId}`}
            >
              {t("result.goToContent", { chapterId: ref.chapterId })}
            </a>
          ))}
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
  const iconName =
    accuracy >= 0.85
      ? "sentiment_excited"
      : accuracy >= 0.65
        ? "sentiment_satisfied"
        : accuracy >= 0.45
          ? "sentiment_neutral"
          : "sentiment_dissatisfied";
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
    if (area === "skill.asymptotic.big_o.upper-bound-interpretation") {
      return t("result.areaLabelBigOUpperBoundInterpretation");
    }
    if (area === "skill.limits.series.growth-comparison") {
      return t("result.areaLabelLimitsSeriesGrowthComparison");
    }
    return area;
  });

  return (
    <div className="flex h-full min-h-0 flex-col justify-center text-center">
      <div className="mx-auto w-full max-w-xl">
        <span
          aria-hidden="true"
          className={`material-symbols-outlined leading-none ${iconColor}`}
          style={{
            fontSize: "6rem",
            lineHeight: 1,
            fontVariationSettings: '"FILL" 1, "wght" 500, "GRAD" 0, "opsz" 48',
          }}
        >
          {iconName}
        </span>
        <h2 className="mt-3 text-xl font-semibold">{t("result.title")}</h2>
        <div
          className={`glass-card quiz-no-hover mt-3 rounded-lg border px-3 py-2 text-sm font-medium ${toneClass}`}
        >
          {t(headlineKey)}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-primary/40 bg-primary/20 px-3 py-2">
            <p className="text-[11px] text-sky-200/90">{t("result.grade")}</p>
            <p className="text-lg font-semibold text-sky-100">
              {gradeOutOfFive.toFixed(1)} / 5.0
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-2">
            <p className="text-[11px] text-emerald-200/90">{t("result.correct")}</p>
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

        <p className="mt-4 text-xs text-slate-300">
          {t("result.areasIntro")}{" "}
          {formattedAreas.length ? formattedAreas.join(", ") : t("result.none")}
        </p>
      </div>
    </div>
  );
}
