"use client";

import type { QuizSessionResult } from "@aa/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GlobalLoader } from "@/components/GlobalLoader";
import {
  QuizQuestionCard,
  QuizQuestionReviewCard,
  QuizResultView,
} from "@/features/quizzes/components/QuizQuestionCard";
import { toStudentAnswers } from "@/features/quizzes/lib/quizAnswerAdapters";
import {
  type AnswerState,
  isQuestionComplete,
} from "@/features/quizzes/lib/quizCompletion";
import type { Locale } from "@/i18n/routing";

import { useQuizSession } from "./useQuizSession";
import { QuizEmptyState } from "../components/QuizEmptyState";
import { QuizErrorState } from "../components/QuizErrorState";

export interface QuizSessionViewProps {
  locale?: Locale;
  source?: "dashboard" | "course-module";
  moduleId?: string;
  /** Solo UI: título humano del módulo (p. ej. desde la card del curso) */
  moduleTitle?: string;
  selectedTopicIds?: string[];
  selectedSkillIds?: string[];
  questionCount?: number;
  difficultyMix?: Record<"basic" | "intermediate" | "advanced", number>;
  autoStart?: boolean;
  onCompleted?: (result: QuizSessionResult) => void;
  onExit?: () => void;
}

export function QuizSessionView({
  moduleId,
  moduleTitle,
  selectedTopicIds,
  selectedSkillIds,
  questionCount = 5,
  difficultyMix,
  autoStart = false,
  onCompleted,
  onExit,
}: QuizSessionViewProps) {
  const t = useTranslations("quizzes");
  const {
    session,
    result,
    loading,
    error,
    startSession,
    submitAnswers,
    questions,
  } = useQuizSession({
    moduleId,
    moduleTitle,
    selectedTopicIds,
    selectedSkillIds,
    questionCount,
    difficultyMix,
  });
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<string, AnswerState>
  >({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const autoStartedRef = useRef(false);

  const isCurrentComplete = useMemo(() => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return false;
    return isQuestionComplete(
      currentQuestion,
      answersByQuestion[currentQuestion.questionId],
    );
  }, [answersByQuestion, currentIndex, questions]);

  const canSubmit = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((question) =>
      isQuestionComplete(question, answersByQuestion[question.questionId]),
    );
  }, [answersByQuestion, questions]);

  const handleStart = useCallback(async () => {
    setAnswersByQuestion({});
    setCurrentIndex(0);
    setReviewIndex(0);
    await startSession(questionCount);
  }, [questionCount, startSession]);

  useEffect(() => {
    if (!autoStart) return;
    if (autoStartedRef.current) return;
    if (session || loading || result) return;
    autoStartedRef.current = true;
    void handleStart();
  }, [autoStart, handleStart, loading, result, session]);

  const handleSubmit = async () => {
    const answers = toStudentAnswers(questions, answersByQuestion);
    const evaluated = await submitAnswers(answers);
    setReviewIndex(0);
    if (onCompleted) {
      onCompleted(evaluated);
    }
  };

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const reviewTotal = result ? result.results.length + 1 : 0;
  const isSummaryStep = !!result && reviewIndex === 0;
  const currentReviewResult =
    result && reviewIndex > 0 ? result.results[reviewIndex - 1] : undefined;
  const currentReviewQuestion = currentReviewResult
    ? questions.find(
        (item) => item.questionId === currentReviewResult.questionId,
      )
    : null;

  return (
    <section
      className="mx-auto flex w-full max-w-3xl flex-col p-2 pb-0 text-slate-100 sm:p-4 sm:pb-0"
    >
      {!session && autoStart && (loading || !error) ? (
        <div className="mt-6 flex min-h-0 flex-1 items-center justify-center">
          <GlobalLoader variant="pulse" size="xl" />
        </div>
      ) : null}

      {!session && !autoStart ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/35 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base leading-none">
              play_arrow
            </span>
            {loading ? t("actions.loadingSession") : t("actions.start")}
          </button>
        </div>
      ) : null}

      {error ? (
        <QuizErrorState className="mt-4" message={t("error.backend")} />
      ) : null}

      {!loading && session && questions.length === 0 ? (
        <div className="mt-6">
          <QuizEmptyState message={t("empty.noQuestions")} />
        </div>
      ) : null}

      {!result && questions.length > 0 && currentQuestion ? (
        <div className="mt-1 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full w-full rounded-full bg-primary transition-transform duration-300 ease-out"
              style={{
                transform: `scaleX(${(currentIndex + 1) / total})`,
                transformOrigin: "left center",
              }}
            />
          </div>

          <div className="h-[60vh] min-h-[360px] max-h-[640px]">
            <QuizQuestionCard
              key={currentQuestion.questionId}
              question={currentQuestion}
              index={currentIndex}
              value={answersByQuestion[currentQuestion.questionId] ?? {}}
              onChange={(next) => {
                setAnswersByQuestion((prev) => ({
                  ...prev,
                  [currentQuestion.questionId]: next,
                }));
              }}
            />
          </div>

          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => {
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
              className="inline-flex h-10 min-w-[4.5rem] items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:min-w-36"
            >
              <span className="material-symbols-outlined text-base leading-none">
                arrow_back
              </span>
              <span className="hidden sm:inline">{t("actions.previous")}</span>
            </button>
            <button
              type="button"
              disabled={currentIndex >= total - 1 || !isCurrentComplete}
              onClick={() => {
                setCurrentIndex((prev) => Math.min(total - 1, prev + 1));
              }}
              className="inline-flex h-10 min-w-[4.5rem] items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:min-w-36"
            >
              <span className="hidden sm:inline">{t("actions.next")}</span>
              <span className="material-symbols-outlined text-base leading-none">
                arrow_forward
              </span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-lg border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 ${
                loading
                  ? "border-white/10 bg-white/5 text-slate-300"
                  : canSubmit
                    ? "border-primary/50 bg-primary/20 text-sky-100 hover:bg-primary/30"
                    : "border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
              }`}
            >
              <span className="material-symbols-outlined text-base leading-none">
                task_alt
              </span>
              {loading ? t("actions.evaluating") : t("actions.finish")}
            </button>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="mt-1 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          {isSummaryStep ? (
            <div className="h-[60vh] min-h-[360px] max-h-[640px]">
              <article className="glass-card quiz-no-hover relative flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-[rgba(24,36,49,0.94)] p-4 sm:p-5">
                <QuizResultView result={result} />
              </article>
            </div>
          ) : currentReviewQuestion && currentReviewResult ? (
            <div className="h-[60vh] min-h-[360px] max-h-[640px]">
              <QuizQuestionReviewCard
                question={currentReviewQuestion}
                result={currentReviewResult}
                index={reviewIndex - 1}
              />
            </div>
          ) : (
            <QuizErrorState message={t("error.unsupportedQuestion")} />
          )}

          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={reviewIndex === 0}
              onClick={() => setReviewIndex((prev) => Math.max(0, prev - 1))}
              className="inline-flex h-10 min-w-[4.5rem] items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:min-w-36"
            >
              <span className="material-symbols-outlined text-base leading-none">
                arrow_back
              </span>
              <span className="hidden sm:inline">{t("actions.previous")}</span>
            </button>
            <button
              type="button"
              disabled={reviewIndex >= reviewTotal - 1}
              onClick={() =>
                setReviewIndex((prev) => Math.min(reviewTotal - 1, prev + 1))
              }
              className="inline-flex h-10 min-w-[4.5rem] items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:min-w-36"
            >
              <span className="hidden sm:inline">{t("actions.next")}</span>
              <span className="material-symbols-outlined text-base leading-none">
                arrow_forward
              </span>
            </button>
            <button
              type="button"
              onClick={onExit ?? handleStart}
              disabled={loading}
              className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/20 px-3 text-sm text-sky-100 transition-colors hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9"
            >
              <span className="material-symbols-outlined text-base leading-none">
                check_circle
              </span>
              {t("actions.finish")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
