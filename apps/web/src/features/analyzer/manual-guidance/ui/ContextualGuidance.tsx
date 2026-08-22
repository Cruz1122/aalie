import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import type { EditorContext } from "../context/types";
import {
  getRecommendationDescriptionKey,
  getRecommendationTitleKey,
} from "../presentation/contextPresentation";
import type { GuidanceRecommendation } from "../recommendations/types";

const RECOMMENDATION_ICONS: Record<string, string> = {
  "algorithm-header": "function",
  comment: "comment",
  assign: "edit_note",
  if: "alt_route",
  for: "repeat",
  while: "sync",
  "repeat-until": "autorenew",
  "begin-end": "account_tree",
  call: "call",
  "return-value": "output",
  comparison: "compare_arrows",
  and: "join_inner",
  or: "call_split",
  not: "rule",
  symbols: "data_object",
  "parameter-symbols": "variable_add",
  "array-index": "data_array",
};

function getRecommendationIcon(recommendation: GuidanceRecommendation) {
  return (
    RECOMMENDATION_ICONS[recommendation.id] ??
    (recommendation.action === "analyze" ? "analytics" : "add")
  );
}

interface ContextualGuidanceProps {
  readonly context: EditorContext;
  readonly recommendations: readonly GuidanceRecommendation[];
  readonly onAnalyze: () => void;
  readonly onTutorial: () => void;
  readonly onActiveRecommendationChange?: (
    recommendation: GuidanceRecommendation | null,
  ) => void;
}

export function ContextualGuidance({
  context,
  recommendations,
  onAnalyze,
  onTutorial,
  onActiveRecommendationChange,
}: Readonly<ContextualGuidanceProps>) {
  const t = useTranslations("analyzer.manualGuidance");
  const isEmptyDocument = context.location.primary === "EMPTY_DOCUMENT";
  const carouselRecommendations = recommendations.slice(0, 4);
  const recommendationKey = carouselRecommendations
    .map(
      (recommendation) =>
        `${recommendation.id}:${recommendation.action}:${recommendation.intent}:${recommendation.reason}:${recommendation.snippetId ?? ""}`,
    )
    .join("|");
  const [activeRecommendation, setActiveRecommendation] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [isCarouselResetting, setIsCarouselResetting] = useState(false);

  useEffect(() => {
    setActiveRecommendation(0);
  }, [recommendationKey]);

  useEffect(() => {
    if (carouselRecommendations.length < 2 || isCarouselPaused) return;

    const interval = globalThis.window.setInterval(() => {
      setActiveRecommendation((current) => current + 1);
    }, 4200);

    return () => globalThis.window.clearInterval(interval);
  }, [
    carouselRecommendations.length,
    isCarouselPaused,
    recommendationKey,
  ]);

  const renderedRecommendations =
    carouselRecommendations.length > 1
      ? [...carouselRecommendations, carouselRecommendations[0]!]
      : carouselRecommendations;
  const currentRecommendation =
    Math.min(
      activeRecommendation,
      Math.max(carouselRecommendations.length - 1, 0),
    ) + 1;
  const recommendationProgress =
    carouselRecommendations.length > 0
      ? (currentRecommendation / carouselRecommendations.length) * 100
      : 0;
  const visibleRecommendation =
    isEmptyDocument ||
    carouselRecommendations.length === 0 ||
    isCarouselResetting ||
    activeRecommendation >= carouselRecommendations.length
      ? null
      : (carouselRecommendations[activeRecommendation] ?? null);

  useEffect(() => {
    onActiveRecommendationChange?.(visibleRecommendation);
  }, [
    isEmptyDocument,
    onActiveRecommendationChange,
    recommendationKey,
    isCarouselResetting,
    activeRecommendation,
    visibleRecommendation,
  ]);

  if (isEmptyDocument) {
    return (
      <section
        aria-labelledby="manual-contextual-intro-title"
        className="flex h-full min-h-[320px] w-full flex-col items-center p-5 text-center"
      >
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-6">
          <span
            className="manual-contextual-illustration material-symbols-outlined text-cyan-300"
            aria-hidden="true"
            style={{ fontSize: 72, lineHeight: 1 }}
          >
            engineering
          </span>
          <h2
            id="manual-contextual-intro-title"
            className="mt-5 text-2xl font-bold tracking-tight text-white"
          >
            {t("context.intro.title")}
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
            {t("context.intro.description")}
          </p>
        </div>
        <div className="mt-auto grid min-h-[52px] w-full grid-cols-3 items-center gap-3 pt-4">
          <button
            type="button"
            onClick={onTutorial}
            className="col-start-2 justify-self-center text-sm text-slate-400 underline-offset-4 transition-colors hover:text-slate-200 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            {t("tutorial.return")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={t("context.eyebrow")}
      className="flex h-full min-h-0 w-full flex-col gap-4 p-4"
    >
      {context.location.primary === "UNKNOWN" &&
      recommendations.length === 0 ? (
        <p className="rounded-xl border border-white/10 p-3 text-sm leading-6 text-slate-400">
          {t("context.unknown.description")}
        </p>
      ) : null}
      {carouselRecommendations.length > 0 ? (
        <div className="flex min-h-[260px] flex-1 flex-col">
          {carouselRecommendations.length > 1 ? (
            <div
              className="shrink-0 px-3 pt-1"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={carouselRecommendations.length}
              aria-valuenow={currentRecommendation}
              aria-label={t("tutorial.progress", {
                current: currentRecommendation,
                total: carouselRecommendations.length,
              })}
            >
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-300 transition-[width] duration-700 ease-out motion-reduce:transition-none"
                  style={{
                    width: `${recommendationProgress}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
          <div
            className="flex min-h-0 flex-1 items-center overflow-hidden"
            role="region"
            aria-roledescription="carousel"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
            onFocusCapture={() => setIsCarouselPaused(true)}
            onBlurCapture={() => setIsCarouselPaused(false)}
          >
            <div
              className={`flex h-full w-full ease-out motion-reduce:transition-none ${
                isCarouselResetting
                  ? "transition-none"
                  : "transition-transform duration-700"
              }`}
              style={{
                transform: `translateX(-${activeRecommendation * 100}%)`,
              }}
              onTransitionEnd={(event) => {
                if (
                  event.target !== event.currentTarget ||
                  activeRecommendation !== carouselRecommendations.length
                )
                  return;

                setIsCarouselResetting(true);
                setActiveRecommendation(0);
                globalThis.window.requestAnimationFrame(() => {
                  setIsCarouselResetting(false);
                });
              }}
            >
              {renderedRecommendations.map((recommendation, index) => {
                const title = t(getRecommendationTitleKey(recommendation));

                return (
                  <article
                    key={`${recommendation.id}-${index}`}
                    className="flex min-w-full shrink-0 flex-col items-center justify-center px-3 text-center"
                  >
                    <span
                      className="manual-recommendation-icon material-symbols-outlined text-cyan-300"
                      aria-hidden="true"
                      style={{
                        fontSize: 64,
                        lineHeight: 1,
                        animationDelay: `${index * 140}ms`,
                      }}
                    >
                      {getRecommendationIcon(recommendation)}
                    </span>
                    <h3 className="mt-5 text-xl font-bold tracking-tight text-white">
                      {title}
                    </h3>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
                      {t(getRecommendationDescriptionKey(recommendation))}
                    </p>
                    {recommendation.action === "analyze" ? (
                      <button
                        type="button"
                        onClick={onAnalyze}
                        aria-label={`${title}: ${t("actions.analyze")}`}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 motion-reduce:transition-none"
                      >
                        <span
                          className="material-symbols-outlined text-[17px]"
                          aria-hidden="true"
                        >
                          analytics
                        </span>
                        {t("actions.analyze")}
                      </button>
                    ) : (
                      <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                        <kbd className="rounded border border-cyan-300/50 bg-cyan-300/10 px-2 py-1 font-mono text-xs text-cyan-100">
                          Tab
                        </kbd>
                        {t("actions.applyWithTab")}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
      <div className="mt-auto grid min-h-[52px] w-full grid-cols-3 items-center gap-3 pt-4">
        <button
          type="button"
          onClick={onTutorial}
          className="col-start-2 justify-self-center text-sm text-slate-400 underline-offset-4 transition-colors hover:text-slate-200 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          {t("tutorial.return")}
        </button>
      </div>
    </section>
  );
}
