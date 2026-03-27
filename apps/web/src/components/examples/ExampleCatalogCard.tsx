"use client";

import React, { useState } from "react";

import type {
  ExampleCatalogItem,
  ExampleLocale,
  RecursiveMethodBadge,
} from "@/lib/examples/catalog";
import {
  EXAMPLE_CATEGORY_META,
  EXAMPLE_FAMILY_ICONS,
  getFamilyLabel,
  getMethodTooltip,
  isRecursiveCategory,
} from "@/lib/examples/catalog";

const METHOD_CLASSNAMES: Record<RecursiveMethodBadge, string> = {
  TM: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  IT: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  AR: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  EC: "border-blue-500/30 bg-blue-500/10 text-blue-200",
};

const GRAMMAR_KEYWORDS = [
  "BEGIN",
  "END",
  "IF",
  "THEN",
  "ELSE",
  "FOR",
  "TO",
  "WHILE",
  "DO",
  "REPEAT",
  "UNTIL",
  "CALL",
  "RETURN",
  "PRINT",
  "MOD",
  "DIV",
  "AND",
  "OR",
  "NOT",
];

const GRAMMAR_TOKEN_REGEX = new RegExp(
  `(\\b(?:${GRAMMAR_KEYWORDS.join("|")})\\b|<-|<=|>=|!=|=|\\+|-|\\*|\\/|\\(|\\)|\\[|\\]|,|;|\\b\\d+\\b)`,
  "g",
);

function renderGrammarLine(line: string): React.ReactNode[] {
  return line.split(GRAMMAR_TOKEN_REGEX).map((token, index) => {
    if (!token) return null;
    if (/^\d+$/.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-amber-300">
          {token}
        </span>
      );
    }
    if (GRAMMAR_KEYWORDS.includes(token)) {
      return (
        <span key={`${token}-${index}`} className="font-semibold text-sky-300">
          {token}
        </span>
      );
    }
    if (/^(<-|<=|>=|!=|=|\+|-|\*|\/|\(|\)|\[|\]|,|;)$/.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-violet-300">
          {token}
        </span>
      );
    }
    return <span key={`${token}-${index}`}>{token}</span>;
  });
}

interface ExampleCatalogCardProps {
  example: ExampleCatalogItem;
  locale: ExampleLocale;
  showCategory?: boolean;
  highlighted?: boolean;
  analyzingExampleId: string | null;
  onAnalyze: (example: ExampleCatalogItem) => void;
  viewLabel: string;
  hideLabel: string;
  analyzeLabel: string;
  analyzingLabel: string;
}

export function ExampleCatalogCard({
  example,
  locale,
  showCategory = false,
  highlighted = false,
  analyzingExampleId,
  onAnalyze,
  viewLabel,
  hideLabel,
  analyzeLabel,
  analyzingLabel,
}: ExampleCatalogCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isAnalyzing = analyzingExampleId === example.id;
  const disableActions = analyzingExampleId !== null;
  const copy = example.copy[locale];
  const categoryMeta = EXAMPLE_CATEGORY_META[example.category];
  const recursive = isRecursiveCategory(example.category);
  const kindLabel = recursive
    ? locale === "es"
      ? "Recursivo"
      : "Recursive"
    : locale === "es"
      ? "Iterativo"
      : "Iterative";
  const familyLabel = getFamilyLabel(example.family, locale);
  const behaviorIcon = EXAMPLE_FAMILY_ICONS[example.family];

  return (
    <article
      id={`example-${example.id}`}
      className={`glass-card flex h-[340px] flex-col overflow-hidden rounded-2xl border border-white/10 p-4 transition-all duration-200 hover:border-white/20 ${
        highlighted ? "ring-2 ring-primary/50" : ""
      }`}
    >
      <div className="flex-1 min-h-0 overflow-hidden">
        {expanded ? (
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/10">
            <div className="shrink-0 border-b border-white/10 px-2 py-1">
              <span className="text-[10px] text-slate-300">Pseudocode</span>
            </div>
            <div className="scrollbar-custom overscroll-contain flex-1 min-h-0 overflow-y-auto overflow-x-auto p-3">
              <code className="block min-w-min whitespace-pre font-mono text-[11px] leading-relaxed text-slate-100">
                {example.sourceCode.split("\n").map((line, index) => (
                  <div key={`${example.id}-line-${index}`}>{renderGrammarLine(line)}</div>
                ))}
              </code>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="h-14 w-14 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-primary">
                {behaviorIcon}
              </span>
            </div>
            <h3 className="line-clamp-2 text-base font-semibold text-white">
              {copy.title}
            </h3>
            {showCategory && (
              <span className="mx-auto rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                {categoryMeta.label[locale]}
              </span>
            )}
            <p className="line-clamp-2 w-full text-xs leading-relaxed text-dark-text">
              {copy.summary}
            </p>
            <div className="flex w-full flex-wrap justify-center gap-1.5">
              <span className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                {familyLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                {kindLabel}
              </span>
              {example.verifiedMethods.map((method) => (
                <span
                  key={method}
                  title={getMethodTooltip(method, locale)}
                  aria-label={getMethodTooltip(method, locale)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${METHOD_CLASSNAMES[method]}`}
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setExpanded((previous) => !previous)}
          disabled={disableActions}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-sm">
            {expanded ? "visibility_off" : "visibility"}
          </span>
          {expanded ? hideLabel : viewLabel}
        </button>
        <button
          type="button"
          onClick={() => onAnalyze(example)}
          disabled={disableActions}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-sm ${isAnalyzing ? "animate-spin" : ""}`}>
            {isAnalyzing ? "progress_activity" : "play_arrow"}
          </span>
          {isAnalyzing ? analyzingLabel : analyzeLabel}
        </button>
      </div>
    </article>
  );
}
