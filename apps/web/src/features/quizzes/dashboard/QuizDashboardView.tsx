"use client";

import { PlayCircle, Trash2 } from "lucide-react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AALIEEmotionIcon from "@/components/AALIEEmotionIcon";
import { EmbeddedAssistantLauncher } from "@/components/assistant/EmbeddedAssistantLauncher";
import Footer from "@/components/Footer";
import { GlobalLoader } from "@/components/GlobalLoader";
import Header from "@/components/Header";
import { PaginationControls } from "@/components/PaginationControls";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import type { AssistantContext } from "@/lib/assistant/types";
import type { Locale } from "@/i18n/routing";

import { clearQuizAutostartDedupeKeys } from "../lib/quizAutostartDedupe";
import { buildAssistantQuizDashboardContext } from "../assistant/quizAssistantContext";
import { buildQuizDashboardCards } from "./buildQuizDashboardCards";
import { HalfRouletteWheel } from "./HalfRouletteWheel";
import type { StartQuizOptions } from "./quizDashboardTypes";
import { StartQuizModal } from "./StartQuizModal";
import { useQuizDashboard } from "./useQuizDashboard";
import { clearQuizDashboardStorage } from "../storage/quizAttemptStorage";
import { QuizSessionView } from "../session/QuizSessionView";

interface QuizDashboardViewProps {
  locale: Locale | string;
  moduleTitleById?: Record<string, string>;
}

function iconForCard(kind: string) {
  switch (kind) {
    case "start":
      return "school";
    case "average":
      return "donut_large";
    case "weakness":
      return "warning";
    case "recent":
      return "history";
    case "strength":
      return "military_tech";
    default:
      return "insights";
  }
}

function hoverIconForCard(kind: string) {
  switch (kind) {
    case "start":
      return "arrow_forward";
    case "average":
      return "visibility";
    case "weakness":
      return "play_circle";
    case "recent":
      return "history_toggle_off";
    case "strength":
      return "rocket_launch";
    default:
      return "arrow_forward";
  }
}

/**
 * URL real del cliente primero: tras `history.replaceState` el hook puede seguir
 * devolviendo la query antigua (StrictMode remount / desfase), y se re-disparaba el arranque.
 */
function getSearchParam(
  name: string,
  searchParams: ReadonlyURLSearchParams,
): string | null {
  if (typeof window !== "undefined") {
    const fromWindow = new URLSearchParams(window.location.search).get(name);
    if (fromWindow != null && String(fromWindow).length > 0) {
      return fromWindow;
    }
  }
  const fromHook = searchParams.get(name);
  if (fromHook != null && String(fromHook).length > 0) {
    return fromHook;
  }
  return null;
}

function colorForCardIcon(kind: string) {
  switch (kind) {
    case "start":
      return "text-cyan-300";
    case "average":
      return "text-violet-300";
    case "weakness":
      return "text-amber-300";
    case "recent":
      return "text-slate-200";
    case "strength":
      return "text-emerald-300";
    default:
      return "text-slate-200";
  }
}

function scoreTone(accuracy: number) {
  const scoreOverFive = Math.max(0, Math.min(5, accuracy * 5));

  if (scoreOverFive <= 0.5) {
    return {
      card: "border-rose-400/35 bg-rose-500/10",
      text: "text-rose-300",
      icon: "text-rose-300",
      emotion: "worried" as const,
    };
  }
  if (scoreOverFive <= 1.0) {
    return {
      card: "border-orange-400/35 bg-orange-500/10",
      text: "text-orange-300",
      icon: "text-orange-300",
      emotion: "confused" as const,
    };
  }
  if (scoreOverFive <= 2.0) {
    return {
      card: "border-amber-400/35 bg-amber-500/10",
      text: "text-amber-300",
      icon: "text-amber-300",
      emotion: "thinking" as const,
    };
  }
  if (scoreOverFive <= 3.0) {
    return {
      card: "border-lime-400/35 bg-lime-500/10",
      text: "text-lime-300",
      icon: "text-lime-300",
      emotion: "focused" as const,
    };
  }
  if (scoreOverFive <= 3.9) {
    return {
      card: "border-emerald-400/35 bg-emerald-500/10",
      text: "text-emerald-300",
      icon: "text-emerald-300",
      emotion: "curious" as const,
    };
  }
  if (scoreOverFive <= 4.5) {
    return {
      card: "border-cyan-400/35 bg-cyan-500/10",
      text: "text-cyan-300",
      icon: "text-cyan-300",
      emotion: "satisfied" as const,
    };
  }
  return {
    card: "border-sky-400/35 bg-sky-500/10",
    text: "text-sky-300",
    icon: "text-sky-300",
    emotion: "happy" as const,
  };
}

function formatModuleLabel(
  attempt: { moduleId?: string; moduleTitle?: string },
  moduleTitleById?: Record<string, string>,
) {
  if (attempt.moduleId && moduleTitleById?.[attempt.moduleId]) {
    return moduleTitleById[attempt.moduleId];
  }
  if (attempt.moduleTitle?.trim()) {
    return attempt.moduleTitle.trim();
  }
  if (!attempt.moduleId) {
    return null;
  }
  return attempt.moduleId
    .replace(/^mod-/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\p{L}/gu, (char) => char.toLocaleUpperCase());
}

export function QuizDashboardView({
  locale,
  moduleTitleById,
}: QuizDashboardViewProps) {
  const tDashboard = useTranslations("quizzes.dashboard");
  const tTopics = useTranslations("quizzes.topics");
  const searchParams = useSearchParams();
  const { runAnalysis } = useRunAnalysis();
  const { metrics, progress, attempts, isLoaded, reload } = useQuizDashboard();
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [activeQuizOptions, setActiveQuizOptions] =
    useState<StartQuizOptions | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const queryStartHandledRef = useRef(false);
  const HISTORY_PAGE_SIZE = 9;

  const formatTopicLabel = useCallback(
    (topicId: string): string => {
      try {
        return tTopics(topicId as Parameters<typeof tTopics>[0]);
      } catch {
        return topicId.replace(/_/g, " ");
      }
    },
    [tTopics],
  );

  const cards = useMemo(() => {
    if (!isLoaded) return [];
    return buildQuizDashboardCards({
      metrics,
      attempts,
      i18n: {
        newTestEyebrow: tDashboard("cards.newTestEyebrow"),
        firstQuizTitle: tDashboard("cards.firstQuizTitle"),
        firstQuizDescription: tDashboard("cards.firstQuizDescription"),
        noHistoryProgress: tDashboard("cards.noHistoryProgress"),
        firstQuizCta: tDashboard("cards.firstQuizCta"),
        emptyStateEyebrow: tDashboard("cards.emptyStateEyebrow"),
        noStatsTitle: tDashboard("cards.noStatsTitle"),
        noStatsDescription: tDashboard("cards.noStatsDescription"),
        pendingProgress: tDashboard("cards.pendingProgress"),
        diagnosticCta: tDashboard("cards.diagnosticCta"),
        recommendedPracticeEyebrow: tDashboard(
          "cards.recommendedPracticeEyebrow",
        ),
        practiceAreaTitle: (area) =>
          tDashboard("cards.practiceAreaTitle", { area }),
        topicLabel: (topicId) => formatTopicLabel(topicId),
        newQuizTitle: tDashboard("cards.newQuizTitle"),
        recommendedPracticeDescription: tDashboard(
          "cards.recommendedPracticeDescription",
        ),
        adaptiveDescription: tDashboard("cards.adaptiveDescription"),
        currentAverageProgress: tDashboard("cards.currentAverageProgress"),
        startQuizCta: tDashboard("cards.startQuizCta"),
        averageEyebrow: tDashboard("cards.averageEyebrow"),
        averageUnavailableTitle: tDashboard("cards.averageUnavailableTitle"),
        averageTitle: (score) => tDashboard("cards.averageTitle", { score }),
        averageDescription: tDashboard("cards.averageDescription"),
        averageAccuracyProgress: tDashboard("cards.averageAccuracyProgress"),
        viewHistoryCta: tDashboard("cards.viewHistoryCta"),
        weaknessEyebrow: tDashboard("cards.weaknessEyebrow"),
        noCriticalWeaknessTitle: tDashboard("cards.noCriticalWeaknessTitle"),
        weaknessDescription: tDashboard("cards.weaknessDescription"),
        noWeaknessDescription: tDashboard("cards.noWeaknessDescription"),
        masteryProgress: tDashboard("cards.masteryProgress"),
        practiceAreaCta: tDashboard("cards.practiceAreaCta"),
        generalTestCta: tDashboard("cards.generalTestCta"),
        latestTestEyebrow: tDashboard("cards.latestTestEyebrow"),
        latestTitle: (percent) => tDashboard("cards.latestTitle", { percent }),
        noLatestTitle: tDashboard("cards.noLatestTitle"),
        latestDescription: (correct, total) =>
          tDashboard("cards.latestDescription", { correct, total }),
        noLatestDescription: tDashboard("cards.noLatestDescription"),
        resultProgress: tDashboard("cards.resultProgress"),
        retryCta: tDashboard("cards.retryCta"),
        strengthEyebrow: tDashboard("cards.strengthEyebrow"),
        pendingStrengthTitle: tDashboard("cards.pendingStrengthTitle"),
        strengthDescription: tDashboard("cards.strengthDescription"),
        noStrengthDescription: tDashboard("cards.noStrengthDescription"),
        keepPracticingCta: tDashboard("cards.keepPracticingCta"),
      },
    });
  }, [attempts, formatTopicLabel, isLoaded, metrics, tDashboard]);

  const quizAssistantContext = useMemo<AssistantContext>(
    () => ({
      surface: "quizzes",
      locale: String(locale),
      pageContext: {
        route: `/${locale}/quizzes`,
        view: "dashboard",
        title: tDashboard("title"),
        description: tDashboard("subtitle"),
        notes: [
          `loaded=${isLoaded ? "true" : "false"}`,
          `totalAttempts=${metrics.totalAttempts}`,
          `averageAccuracy=${metrics.averageAccuracy}`,
          `historyEntries=${attempts.length}`,
          `weakSkills=${progress?.weakSkillIds?.length ?? 0}`,
          `weakTopics=${progress?.lastFailedTopicIds?.length ?? 0}`,
        ],
      },
      quizDashboard: buildAssistantQuizDashboardContext({
        metrics,
        progress,
        formatTopicId: formatTopicLabel,
      }),
    }),
    [
      attempts.length,
      formatTopicLabel,
      isLoaded,
      locale,
      metrics,
      progress,
      tDashboard,
    ],
  );

  useEffect(() => {
    if (queryStartHandledRef.current) return;
    if (activeQuizOptions) return;

    const startFlag = getSearchParam("start", searchParams);
    const moduleIdRaw = getSearchParam("moduleId", searchParams)?.trim();
    const moduleId = moduleIdRaw ? moduleIdRaw : undefined;
    const moduleTitleRaw = getSearchParam("moduleTitle", searchParams)?.trim();
    const moduleTitle = moduleTitleRaw ? moduleTitleRaw : undefined;
    const countRaw =
      getSearchParam("count", searchParams) ??
      getSearchParam("questionCount", searchParams);
    const topicRaw =
      getSearchParam("topics", searchParams) ??
      getSearchParam("topicIds", searchParams);
    const skillRaw =
      getSearchParam("skills", searchParams) ??
      getSearchParam("skillIds", searchParams);
    const topicIds = topicRaw
      ? topicRaw
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : undefined;
    const skillIds = skillRaw
      ? skillRaw
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : undefined;
    const parsedCount = countRaw ? Number.parseInt(countRaw, 10) : undefined;
    const questionCount =
      typeof parsedCount === "number" &&
      Number.isFinite(parsedCount) &&
      parsedCount > 0
        ? parsedCount
        : undefined;

    const shouldStart =
      startFlag === "1" ||
      !!moduleId ||
      !!topicIds?.length ||
      !!skillIds?.length ||
      !!questionCount;

    if (!shouldStart) return;

    queryStartHandledRef.current = true;
    setActiveQuizOptions({
      moduleId,
      moduleTitle,
      topicIds,
      skillIds,
      questionCount: questionCount ?? 10,
    });

    if (typeof window !== "undefined") {
      window.history.replaceState(
        window.history.state,
        "",
        `/${locale}/quizzes`,
      );
    }
  }, [activeQuizOptions, locale, searchParams]);

  const historyTotalPages = Math.max(
    1,
    Math.ceil(attempts.length / HISTORY_PAGE_SIZE),
  );

  useEffect(() => {
    setHistoryPage((current) => Math.min(current, historyTotalPages));
  }, [historyTotalPages]);

  const pagedAttempts = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
    return attempts.slice(start, start + HISTORY_PAGE_SIZE);
  }, [attempts, historyPage]);

  function openStartModal() {
    setIsStartModalOpen(true);
  }

  function handleClearQuizProgress() {
    if (!window.confirm(tDashboard("rouletteClearConfirm"))) return;
    clearQuizDashboardStorage();
    setHistoryPage(1);
    reload();
  }

  function goToHistory() {
    const historyAnchor = document.getElementById("quiz-history");
    historyAnchor?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleCardClick(kind: string) {
    if (kind === "average" || kind === "recent") {
      goToHistory();
      return;
    }
    openStartModal();
  }

  function handleStart(opts: StartQuizOptions) {
    setIsStartModalOpen(false);
    setActiveQuizOptions(opts);
  }

  function handleQuizCompleted() {
    reload();
  }

  function handleQuizExit() {
    clearQuizAutostartDedupeKeys();
    reload();
    setActiveQuizOptions(null);
  }

  const clickHint = String(locale).toLowerCase().startsWith("es")
    ? "Haz clic para continuar"
    : "Click to continue";

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <Header />
      <main className="relative z-0 flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-8">
          {activeQuizOptions ? (
            <div className="flex min-h-0 w-full flex-1 flex-col">
              <QuizSessionView
                locale={locale as Locale}
                source="dashboard"
                moduleId={activeQuizOptions.moduleId}
                moduleTitle={activeQuizOptions.moduleTitle}
                selectedTopicIds={activeQuizOptions.topicIds}
                selectedSkillIds={activeQuizOptions.skillIds}
                questionCount={activeQuizOptions.questionCount}
                autoStart={true}
                onCompleted={handleQuizCompleted}
                onExit={handleQuizExit}
              />
            </div>
          ) : (
            <>
              {isLoaded && metrics.totalAttempts === 0 ? (
                <section className="flex min-h-[520px] flex-1 items-center justify-center p-6">
                  <div className="flex max-w-xl flex-col items-center gap-5 text-center">
                    <AALIEEmotionIcon
                      name="happy"
                      size={56}
                      className="text-slate-300"
                    />
                    <p className="text-lg font-semibold text-slate-100">
                      {tDashboard("emptyCentered.message")}
                    </p>
                    <button
                      type="button"
                      onClick={openStartModal}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-400/25 bg-slate-700/40 px-6 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-700/60"
                    >
                      <PlayCircle size={18} />
                      {tDashboard("emptyCentered.cta")}
                    </button>
                  </div>
                </section>
              ) : !isLoaded ? (
                <section className="flex min-h-[520px] flex-1 items-center justify-center">
                  <GlobalLoader variant="pulse" size="xl" />
                </section>
              ) : (
                <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-2 min-[801px]:sm:gap-3">
                  <button
                    type="button"
                    onClick={openStartModal}
                    className="order-2 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-400/25 bg-slate-700/40 px-2.5 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700/60 sm:order-1 sm:w-32 sm:self-center min-[801px]:gap-2 min-[801px]:rounded-xl min-[801px]:px-4 min-[801px]:py-3 min-[801px]:text-sm min-[801px]:w-44 lg:w-48"
                  >
                    <PlayCircle
                      className="h-4 w-4 shrink-0 min-[801px]:h-[18px] min-[801px]:w-[18px]"
                      aria-hidden
                    />
                    {tDashboard("rouletteSideStart")}
                  </button>
                  <div className="order-1 min-w-0 flex-1 sm:order-2 sm:max-w-3xl">
                    <HalfRouletteWheel
                      options={cards.map((card) => ({
                        kind: card.kind,
                        title: card.title,
                        eyebrow: card.eyebrow ?? "",
                        ctaLabel: card.ctaLabel ?? "",
                      }))}
                      handleCardClick={handleCardClick}
                      clickHint={clickHint}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleClearQuizProgress}
                    className="order-3 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-400/35 bg-rose-500/15 px-2.5 py-2 text-xs font-semibold text-rose-100 transition-colors hover:bg-rose-500/25 sm:order-3 sm:w-32 sm:self-center min-[801px]:gap-2 min-[801px]:rounded-xl min-[801px]:px-4 min-[801px]:py-3 min-[801px]:text-sm min-[801px]:w-44 lg:w-48"
                  >
                    <Trash2
                      className="h-4 w-4 shrink-0 min-[801px]:h-[18px] min-[801px]:w-[18px]"
                      aria-hidden
                    />
                    {tDashboard("rouletteSideClear")}
                  </button>
                </div>
              )}

              {isLoaded && metrics.totalAttempts > 0 ? (
                <section id="quiz-history" className="space-y-4">
                  <h2 className="text-center text-2xl font-semibold text-white">
                    {tDashboard("historyCard.eyebrow")}
                  </h2>
                  <div className="documentation-grid">
                    {pagedAttempts.map((attempt) => (
                      <article
                        key={attempt.attemptId}
                        className={`glass-card flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center ${scoreTone(attempt.accuracy).card}`}
                      >
                        <AALIEEmotionIcon
                          name={scoreTone(attempt.accuracy).emotion}
                          size={44}
                          className={scoreTone(attempt.accuracy).icon}
                        />
                        <p
                          className={`text-2xl font-bold ${scoreTone(attempt.accuracy).text}`}
                        >
                          {tDashboard("historyCard.scoreTitle", {
                            score: (
                              Math.round(attempt.accuracy * 50) / 10
                            ).toFixed(1),
                          })}
                        </p>
                        <p className="text-sm font-semibold text-slate-100">
                          {attempt.moduleId
                            ? tDashboard("historyCard.moduleLabel", {
                                moduleId:
                                  formatModuleLabel(attempt, moduleTitleById) ??
                                  attempt.moduleId,
                              })
                            : tDashboard("historyCard.generalSessionLabel")}
                        </p>
                        <p className="text-xs text-slate-300">
                          {attempt.areasToImprove[0]
                            ? tDashboard("historyCard.feedbackImprove", {
                                topic: formatTopicLabel(
                                  attempt.areasToImprove[0],
                                ),
                              })
                            : attempt.strengths[0]
                              ? tDashboard("historyCard.feedbackStrength", {
                                  topic: formatTopicLabel(attempt.strengths[0]),
                                })
                              : tDashboard("historyCard.feedbackNeutral")}
                        </p>
                        <button
                          type="button"
                          onClick={openStartModal}
                          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-400/25 bg-slate-700/35 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-700/55"
                        >
                          {tDashboard("historyCard.ctaLabel")}
                        </button>
                      </article>
                    ))}
                  </div>
                  <PaginationControls
                    currentPage={historyPage}
                    totalPages={historyTotalPages}
                    onPageChange={setHistoryPage}
                    collapseThreshold={9}
                  />
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>
      {!activeQuizOptions ? (
        <EmbeddedAssistantLauncher
          surface="quizzes"
          assistantContext={quizAssistantContext}
          onAnalyzeCode={(code) => {
            void runAnalysis(code);
          }}
        />
      ) : null}
      <Footer />

      <StartQuizModal
        open={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onStart={handleStart}
        weakTopics={progress?.lastFailedTopicIds ?? []}
        weakSkillIds={progress?.weakSkillIds ?? []}
      />
    </div>
  );
}
