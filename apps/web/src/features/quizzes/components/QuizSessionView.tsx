"use client";

import type { QuizQuestion } from "@aa/types";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  QuizQuestionCard,
  QuizQuestionReviewCard,
  QuizResultView,
} from "@/features/quizzes/components/QuizQuestionCard";
import { useQuizSession } from "@/features/quizzes/hooks/useQuizSession";
import { toStudentAnswers } from "@/features/quizzes/lib/quizAnswerAdapters";
import { type AnswerState, isQuestionComplete } from "@/features/quizzes/lib/quizCompletion";

import { QuizEmptyState } from "./QuizEmptyState";
import { QuizErrorState } from "./QuizErrorState";

export function QuizSessionView() {
  const t = useTranslations("quizzes");
  const {
    session,
    result,
    loading,
    error,
    startSession,
    submitAnswers,
    questions,
  } = useQuizSession();
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<string, AnswerState>
  >({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showIncompleteHint, setShowIncompleteHint] = useState(false);

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

  const handleStart = async () => {
    setAnswersByQuestion({});
    setCurrentIndex(0);
    setReviewIndex(0);
    setShowIncompleteHint(false);
    await startSession(5);
  };

  const handleSubmit = async () => {
    const answers = toStudentAnswers(questions, answersByQuestion);
    await submitAnswers(answers);
    setReviewIndex(0);
    setShowIncompleteHint(false);
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
      className="glass-card quiz-no-hover mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[rgba(24,36,49,0.94)] p-4 text-slate-100 sm:p-6"
      style={{ minHeight: "540px", maxHeight: "calc(100svh - 2rem)" }}
    >
      <h1 className="text-center text-xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-center text-sm text-slate-300">{t("subtitle")}</p>

      {!session ? (
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
        <div className="mt-6 flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full w-full rounded-full bg-primary transition-transform duration-300 ease-out"
              style={{
                transform: `scaleX(${(currentIndex + 1) / total})`,
                transformOrigin: "left center",
              }}
            />
          </div>

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
              if (
                isQuestionComplete(currentQuestion, {
                  ...answersByQuestion[currentQuestion.questionId],
                  ...next,
                })
              ) {
                setShowIncompleteHint(false);
              }
            }}
          />

          {showIncompleteHint && !isCurrentComplete ? (
            <p className="text-center text-xs text-amber-300">
              {t("validation.incomplete")}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => {
                setShowIncompleteHint(false);
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
              disabled={currentIndex >= total - 1}
              onClick={() => {
                if (!isCurrentComplete) {
                  setShowIncompleteHint(true);
                  return;
                }
                setShowIncompleteHint(false);
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
              disabled={!canSubmit || loading}
              className={`inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-lg border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 ${
                !canSubmit || loading
                  ? "border-white/10 bg-white/5 text-slate-300"
                  : "border-primary/50 bg-primary/20 text-sky-100 hover:bg-primary/30"
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
        <div className="mt-6 flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
          {isSummaryStep ? (
            <article className="glass-card quiz-no-hover relative flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-[rgba(24,36,49,0.94)] p-4 sm:p-5">
              <QuizResultView result={result} />
            </article>
          ) : currentReviewQuestion && currentReviewResult ? (
            <QuizQuestionReviewCard
              question={currentReviewQuestion}
              result={currentReviewResult}
              index={reviewIndex - 1}
            />
          ) : (
            <QuizErrorState message={t("error.unsupportedQuestion")} />
          )}

          <div className="flex flex-wrap justify-center gap-2">
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
              onClick={handleStart}
              disabled={loading}
              className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/20 px-3 text-sm text-sky-100 transition-colors hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9"
            >
              <span className="material-symbols-outlined text-base leading-none">
                replay
              </span>
              {t("actions.start")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
