"use client";

import type { RecursiveAnalysisStep, RecursiveStepConfidence, RecursiveStepStatus } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { translateBackendContent } from "@/lib/backend-content-translator";

import Formula from "./Formula";

interface AAAnalysisStepCardProps {
  step: RecursiveAnalysisStep;
  accent?: "blue" | "purple" | "orange" | "cyan";
}

const statusClassMap: Record<RecursiveStepStatus, string> = {
  complete: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  partial: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  unsupported: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  error: "bg-red-500/20 text-red-200 border-red-500/40",
};

const confidenceClassMap: Record<RecursiveStepConfidence, string> = {
  high: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  medium: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  low: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

function asLocale(locale: string): "es" | "en" {
  return locale.startsWith("es") ? "es" : "en";
}

type MixedSegment =
  | { kind: "text"; value: string }
  | { kind: "latex-inline"; value: string }
  | { kind: "latex-block"; value: string };

function splitMixedLatexText(content: string): MixedSegment[] {
  if (!content) return [{ kind: "text", value: "" }];
  const pattern = /\\\[(.+?)\\\]|\\\((.+?)\\\)|\$(.+?)\$/gs;
  const segments: MixedSegment[] = [];
  let cursor = 0;
  for (const match of content.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ kind: "text", value: content.slice(cursor, start) });
    }
    if (match[1]) {
      segments.push({ kind: "latex-block", value: match[1].trim() });
    } else if (match[2]) {
      segments.push({ kind: "latex-inline", value: match[2].trim() });
    } else {
      segments.push({ kind: "latex-inline", value: (match[3] ?? "").trim() });
    }
    cursor = start + match[0].length;
  }
  if (cursor < content.length) {
    segments.push({ kind: "text", value: content.slice(cursor) });
  }
  return segments;
}

function MixedLatexText({ text, className }: Readonly<{ text: string; className?: string }>) {
  const segments = useMemo(() => splitMixedLatexText(text), [text]);
  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.kind === "latex-block") {
          return (
            <span key={`m-${index}`} className="my-1 block overflow-x-auto">
              <Formula latex={segment.value} display />
            </span>
          );
        }
        if (segment.kind === "latex-inline") {
          return <Formula key={`m-${index}`} latex={segment.value} className="mx-0.5 align-middle" />;
        }
        return (
          <span key={`m-${index}`} className="whitespace-pre-wrap">
            {segment.value}
          </span>
        );
      })}
    </span>
  );
}

export default function AAAnalysisStepCard({
  step,
  accent = "blue",
}: Readonly<AAAnalysisStepCardProps>) {
  const t = useTranslations("analyzer.analysisSteps");
  const locale = asLocale(useLocale());
  const summary = translateBackendContent(step.summary, locale);
  const conceptNote = translateBackendContent(step.conceptNote, locale);
  const warning = step.warning ? translateBackendContent(step.warning, locale) : null;
  const hasMath = Boolean(step.math.primaryLatex) || step.math.items.length > 0;
  const [isFlipped, setIsFlipped] = useState(false);
  const stepDotClassName =
    accent === "purple"
      ? "absolute left-0 top-0 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-violet-400/50 bg-slate-900 text-sm font-semibold text-violet-300"
      : accent === "cyan"
        ? "absolute left-0 top-0 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/50 bg-slate-900 text-sm font-semibold text-cyan-300"
      : accent === "orange"
        ? "absolute left-0 top-0 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-orange-400/50 bg-slate-900 text-sm font-semibold text-orange-300"
      : "absolute left-0 top-0 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/50 bg-slate-900 text-sm font-semibold text-blue-300";
  const actionButtonClassName =
    accent === "purple"
      ? "rounded-md border border-violet-400/40 bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-200 transition hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
      : accent === "cyan"
        ? "rounded-md border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-200 transition hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      : accent === "orange"
        ? "rounded-md border border-orange-400/40 bg-orange-500/10 px-2 py-1 text-[10px] font-semibold text-orange-200 transition hover:bg-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      : "rounded-md border border-blue-400/40 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-200 transition hover:bg-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";
  const backCardClassName =
    accent === "purple"
      ? "col-start-1 row-start-1 min-w-0 max-w-full rounded-lg border border-violet-400/30 bg-slate-900/90 p-4 transition-opacity duration-220 ease-out motion-reduce:transition-none"
      : accent === "cyan"
        ? "col-start-1 row-start-1 min-w-0 max-w-full rounded-lg border border-cyan-400/30 bg-slate-900/90 p-4 transition-opacity duration-220 ease-out motion-reduce:transition-none"
      : accent === "orange"
        ? "col-start-1 row-start-1 min-w-0 max-w-full rounded-lg border border-orange-400/30 bg-slate-900/90 p-4 transition-opacity duration-220 ease-out motion-reduce:transition-none"
      : "col-start-1 row-start-1 min-w-0 max-w-full rounded-lg border border-blue-400/30 bg-slate-900/90 p-4 transition-opacity duration-220 ease-out motion-reduce:transition-none";
  const backTitleClassName =
    accent === "purple"
      ? "text-sm font-semibold text-violet-200"
      : accent === "cyan"
        ? "text-sm font-semibold text-cyan-200"
      : accent === "orange"
        ? "text-sm font-semibold text-orange-200"
        : "text-sm font-semibold text-blue-200";

  return (
    <div className="relative z-10 w-full max-w-full pl-10 sm:pl-12">
      <div className={stepDotClassName}>
        {step.index}
      </div>
      <div className="relative max-w-full">
        <div className="grid">
          <div
            aria-hidden={isFlipped}
            className={`col-start-1 row-start-1 min-w-0 max-w-full rounded-lg border border-white/10 bg-slate-800/60 p-4 transition-opacity duration-220 ease-out motion-reduce:transition-none ${
              isFlipped
                ? "pointer-events-none opacity-0"
                : "opacity-100"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-white">{step.title}</h4>
              <div className="flex flex-wrap items-center gap-2">
                {step.status !== "complete" && (
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClassMap[step.status]}`}>
                    {t(`status.${step.status}`)}
                  </span>
                )}
                {step.confidence !== "high" && (
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${confidenceClassMap[step.confidence]}`}>
                    {t("confidence")}: {t(`confidenceLevels.${step.confidence}`)}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={t("flipToExplanation")}
                  onClick={() => setIsFlipped(true)}
                  className={actionButtonClassName}
                >
                  {t("flipToExplanation")}
                </button>
              </div>
            </div>

            <div className="mt-2 break-words text-sm leading-relaxed text-slate-200">
              <MixedLatexText text={summary} />
            </div>

            {hasMath && (
              <div className="mt-3 rounded-md border border-white/10 bg-slate-900/70 p-3">
                {step.math.primaryLatex && (
                  <div className="overflow-x-auto">
                    <Formula latex={step.math.primaryLatex} display />
                  </div>
                )}
                {step.math.items.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {step.math.items.map((item) => (
                      <div key={item.id} className="overflow-x-auto rounded border border-white/10 bg-slate-950/60 p-2">
                        <Formula latex={item.latex} display />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {warning && (
              <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs leading-relaxed text-amber-200">
                <span className="font-semibold">{t("warning")}:</span>{" "}
                <MixedLatexText text={warning} />
              </div>
            )}
          </div>

          <div
            aria-hidden={!isFlipped}
            className={`${backCardClassName} ${
              isFlipped
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className={backTitleClassName}>{step.title}</h4>
              <button
                type="button"
                aria-label={t("flipToResult")}
                onClick={() => setIsFlipped(false)}
                className={actionButtonClassName}
              >
                {t("flipToResult")}
              </button>
            </div>
            <div className="mt-2 break-words text-sm leading-relaxed text-slate-100">
              <MixedLatexText text={conceptNote} />
            </div>

            {warning && (
              <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs leading-relaxed text-amber-200">
                <span className="font-semibold">{t("warning")}:</span>{" "}
                <MixedLatexText text={warning} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
