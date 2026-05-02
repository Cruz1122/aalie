"use client";

import { PlayCircle } from "lucide-react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AALIEEmotionIcon from "@/components/AALIEEmotionIcon";
import Footer from "@/components/Footer";
import { GlobalLoader } from "@/components/GlobalLoader";
import Header from "@/components/Header";
import type { Locale } from "@/i18n/routing";

import { buildQuizDashboardCards } from "./buildQuizDashboardCards";
import type { StartQuizOptions } from "./quizDashboardTypes";
import { StartQuizModal } from "./StartQuizModal";
import { useQuizDashboard } from "./useQuizDashboard";
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

/** useSearchParams puede ir un tick detrás de router.push; el navegador ya tiene la query. */
function getSearchParam(
  name: string,
  searchParams: ReadonlyURLSearchParams,
): string | null {
  const fromHook = searchParams.get(name);
  if (fromHook != null && String(fromHook).length > 0) {
    return fromHook;
  }
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get(name);
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
  if (accuracy >= 0.9) {
    return {
      card: "border-emerald-400/35 bg-emerald-500/10",
      text: "text-emerald-300",
      icon: "text-emerald-300",
      emotion: "happy" as const,
    };
  }
  if (accuracy >= 0.75) {
    return {
      card: "border-lime-400/35 bg-lime-500/10",
      text: "text-lime-300",
      icon: "text-lime-300",
      emotion: "satisfied" as const,
    };
  }
  if (accuracy >= 0.55) {
    return {
      card: "border-amber-400/35 bg-amber-500/10",
      text: "text-amber-300",
      icon: "text-amber-300",
      emotion: "focused" as const,
    };
  }
  return {
    card: "border-rose-400/35 bg-rose-500/10",
    text: "text-rose-300",
    icon: "text-rose-300",
    emotion: "determined" as const,
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
  const { metrics, progress, attempts, isLoaded, reload } = useQuizDashboard();
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [activeQuizOptions, setActiveQuizOptions] =
    useState<StartQuizOptions | null>(null);
  const [hoveredCardKey, setHoveredCardKey] = useState<string | null>(null);
  const queryStartHandledRef = useRef(false);
  const hoverDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function openStartModal() {
    setIsStartModalOpen(true);
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
    reload();
    setActiveQuizOptions(null);
  }

  const clickHint = String(locale).toLowerCase().startsWith("es")
    ? "Haz clic para continuar"
    : "Click to continue";

  function handleCardHoverStart(cardKey: string) {
    if (hoverDebounceRef.current) {
      clearTimeout(hoverDebounceRef.current);
    }
    hoverDebounceRef.current = setTimeout(() => {
      setHoveredCardKey(cardKey);
      hoverDebounceRef.current = null;
    }, 120);
  }

  function handleCardHoverEnd() {
    if (hoverDebounceRef.current) {
      clearTimeout(hoverDebounceRef.current);
    }
    hoverDebounceRef.current = setTimeout(() => {
      setHoveredCardKey(null);
      hoverDebounceRef.current = null;
    }, 120);
  }

  useEffect(() => {
    return () => {
      if (hoverDebounceRef.current) {
        clearTimeout(hoverDebounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          {activeQuizOptions ? (
            <section className="flex items-start justify-center">
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
            </section>
          ) : (
            <>
              {isLoaded && metrics.totalAttempts === 0 ? (
                <section className="flex min-h-[520px] items-center justify-center p-6">
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
                <section className="flex min-h-[520px] items-center justify-center">
                  <GlobalLoader variant="pulse" size="xl" />
                </section>
              ) : (
                <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {cards.map((card) => (
                    <button
                      key={`${card.kind}-${card.title}`}
                      type="button"
                      onClick={() => handleCardClick(card.kind)}
                      onMouseEnter={() =>
                        handleCardHoverStart(`${card.kind}-${card.title}`)
                      }
                      onMouseLeave={handleCardHoverEnd}
                      onFocus={() =>
                        setHoveredCardKey(`${card.kind}-${card.title}`)
                      }
                      onBlur={() => setHoveredCardKey(null)}
                      className="group glass-card relative flex aspect-square w-full flex-col items-center justify-center rounded-2xl border border-slate-300/20 bg-slate-700/20 p-4 text-center text-slate-100 transition-colors"
                    >
                      {(() => {
                        const cardKey = `${card.kind}-${card.title}`;
                        const isHovered = hoveredCardKey === cardKey;
                        return (
                          <div className="flex flex-col items-center gap-3">
                            <div
                              className={`flex h-16 w-16 items-center justify-center rounded-full border border-slate-400/25 bg-slate-700/35 transition-all duration-200 ${
                                isHovered
                                  ? "border-slate-200/50 bg-slate-600/50"
                                  : ""
                              }`}
                            >
                              <span
                                className={`material-symbols-outlined text-[28px] leading-none transition-all duration-200 ${
                                  isHovered
                                    ? "scale-110 text-slate-200"
                                    : colorForCardIcon(card.kind)
                                }`}
                              >
                                {isHovered
                                  ? hoverIconForCard(card.kind)
                                  : iconForCard(card.kind)}
                              </span>
                            </div>
                            <h2
                              className={`text-sm font-semibold transition-colors duration-200 ${
                                isHovered
                                  ? "text-slate-200"
                                  : colorForCardIcon(card.kind)
                              }`}
                            >
                              {isHovered ? card.ctaLabel : card.eyebrow}
                            </h2>
                            <p className="text-sm font-semibold leading-5 text-slate-200 transition-all duration-200">
                              {isHovered ? clickHint : card.title}
                            </p>
                          </div>
                        );
                      })()}
                    </button>
                  ))}
                </section>
              )}

              {isLoaded && metrics.totalAttempts > 0 ? (
                <section id="quiz-history" className="space-y-4">
                  <h2 className="text-center text-2xl font-semibold text-white">
                    {tDashboard("historyCard.eyebrow")}
                  </h2>
                  <div className="documentation-grid">
                    {attempts.slice(0, 6).map((attempt) => (
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
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>
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
