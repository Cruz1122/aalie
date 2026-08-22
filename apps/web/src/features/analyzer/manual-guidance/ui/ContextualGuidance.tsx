import { useTranslations } from "next-intl";
import { useState } from "react";

import type { ManualEditorActions } from "./types";
import type { EditorContext } from "../context/types";
import {
  getContextTitleKey,
  getRecommendationDescriptionKey,
  getRecommendationTitleKey,
} from "../presentation/contextPresentation";
import type { GuidanceRecommendation } from "../recommendations/types";

interface ContextualGuidanceProps {
  readonly context: EditorContext;
  readonly recommendations: readonly GuidanceRecommendation[];
  readonly actions: ManualEditorActions;
  readonly onAnalyze: () => void;
  readonly onTutorial: () => void;
}

export function ContextualGuidance({
  context,
  recommendations,
  actions,
  onAnalyze,
  onTutorial,
}: Readonly<ContextualGuidanceProps>) {
  const t = useTranslations("analyzer.manualGuidance");
  const [family, setFamily] = useState<"loop" | "decision" | null>(null);
  const visible =
    family === "loop"
      ? recommendations.filter((item) => item.intent === "loop")
      : family === "decision"
        ? recommendations.filter((item) => item.intent === "decision")
        : recommendations;
  const run = (recommendation: GuidanceRecommendation) => {
    if (recommendation.action === "analyze") return onAnalyze();
    if (!recommendation.snippetId) return actions.focusEditor();
    if (recommendation.action === "wrap")
      return actions.wrapSelection(recommendation.snippetId);
    actions.insertSnippetAtCursor(recommendation.snippetId);
  };

  return (
    <section
      aria-labelledby="manual-context-title"
      className="flex min-h-0 w-full flex-col gap-4 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            {t("context.eyebrow")}
          </p>
          <h2
            id="manual-context-title"
            className="mt-1 text-lg font-bold text-white"
          >
            {t(getContextTitleKey(context))}
          </h2>
        </div>
        <button
          type="button"
          onClick={onTutorial}
          className="text-xs text-cyan-200 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          {t("tutorial.return")}
        </button>
      </div>
      {context.location.primary === "UNKNOWN" &&
      recommendations.length === 0 ? (
        <p className="rounded-xl border border-white/10 p-3 text-sm leading-6 text-slate-400">
          {t("context.unknown.description")}
        </p>
      ) : null}
      <div className="grid gap-2">
        {visible.slice(0, 4).map((recommendation) => (
          <button
            key={recommendation.id}
            type="button"
            onClick={() => run(recommendation)}
            className="group rounded-xl border border-white/10 bg-white/[0.035] p-3 text-left transition-colors hover:border-cyan-400/30 hover:bg-cyan-400/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 motion-reduce:transition-none"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-100">
                {t(getRecommendationTitleKey(recommendation))}
              </span>
              <span
                className="material-symbols-outlined text-cyan-300"
                aria-hidden="true"
              >
                {recommendation.action === "analyze"
                  ? "analytics"
                  : recommendation.action === "wrap"
                    ? "format_shapes"
                    : "add"}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {t(getRecommendationDescriptionKey(recommendation))}
            </p>
          </button>
        ))}
      </div>
      {recommendations.some((item) => item.intent === "loop") ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFamily(family === "loop" ? null : "loop")}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
          >
            {t("families.loop")}
          </button>
          {recommendations.some((item) => item.intent === "decision") ? (
            <button
              type="button"
              onClick={() =>
                setFamily(family === "decision" ? null : "decision")
              }
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
            >
              {t("families.decision")}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
