"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";

import type {
  CatalogTier,
  ExampleCatalogItem,
  ExampleLocale,
  RecursiveMethodBadge,
  TechniqueBadge,
} from "@/lib/examples/catalog";
import {
  EXAMPLE_FAMILY_ICONS,
  getLocalizedExampleSource,
  getMethodTranslationKey,
  isRecursiveCategory,
} from "@/lib/examples/catalog";
import {
  CATEGORY_LABEL_KEYS,
  FAMILY_LABEL_KEYS,
  getLocalizedExampleContent,
  type LocalizedExampleCatalogItem,
} from "@/lib/examples/i18n";

const METHOD_CLASSNAMES: Record<RecursiveMethodBadge, string> = {
  TM: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  IT: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  AR: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  EC: "border-blue-500/30 bg-blue-500/10 text-blue-200",
};

const TECHNIQUE_BADGE_CLASSNAMES: Record<TechniqueBadge, string> = {
  ITER: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  DyV: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  RyV: "border-lime-500/30 bg-lime-500/10 text-lime-200",
  RySV: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  "PD-TD": "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200",
  "PD-BU": "border-violet-500/30 bg-violet-500/10 text-violet-200",
  GREEDY: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  BT: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  "B&B": "border-orange-500/30 bg-orange-500/10 text-orange-200",
  FOR: "border-white/10 bg-slate-950/60 text-slate-300",
  WHILE: "border-white/10 bg-slate-950/60 text-slate-300",
  NESTED: "border-white/10 bg-slate-950/60 text-slate-300",
  FLAG: "border-white/10 bg-slate-950/60 text-slate-300",
  BACKSTEP: "border-white/10 bg-slate-950/60 text-slate-300",
  ACCUM: "border-white/10 bg-slate-950/60 text-slate-300",
  TABLE: "border-white/10 bg-slate-950/60 text-slate-300",
  MEMO: "border-white/10 bg-slate-950/60 text-slate-300",
  MATRIX: "border-white/10 bg-slate-950/60 text-slate-300",
  GRAPH: "border-white/10 bg-slate-950/60 text-slate-300",
  TREE: "border-white/10 bg-slate-950/60 text-slate-300",
  GRID: "border-white/10 bg-slate-950/60 text-slate-300",
  SORT: "border-white/10 bg-slate-950/60 text-slate-300",
  MERGE: "border-white/10 bg-slate-950/60 text-slate-300",
  PARTITION: "border-white/10 bg-slate-950/60 text-slate-300",
  BOUNDARY: "border-white/10 bg-slate-950/60 text-slate-300",
  SINGLE_BRANCH: "border-white/10 bg-slate-950/60 text-slate-300",
  MULTI_BRANCH: "border-white/10 bg-slate-950/60 text-slate-300",
  K_WAY: "border-white/10 bg-slate-950/60 text-slate-300",
  BOUND: "border-white/10 bg-slate-950/60 text-slate-300",
  PRUNE: "border-white/10 bg-slate-950/60 text-slate-300",
  UNDO: "border-white/10 bg-slate-950/60 text-slate-300",
  CHOICE: "border-white/10 bg-slate-950/60 text-slate-300",
  COMMIT: "border-white/10 bg-slate-950/60 text-slate-300",
  PRIORITY: "border-white/10 bg-slate-950/60 text-slate-300",
  OPTIMIZATION: "border-white/10 bg-slate-950/60 text-slate-300",
  INTERVAL: "border-white/10 bg-slate-950/60 text-slate-300",
  MST: "border-white/10 bg-slate-950/60 text-slate-300",
  SHORTEST_PATH: "border-white/10 bg-slate-950/60 text-slate-300",
  SCHEDULING: "border-white/10 bg-slate-950/60 text-slate-300",
  TILING: "border-white/10 bg-slate-950/60 text-slate-300",
  COUNTING: "border-white/10 bg-slate-950/60 text-slate-300",
  RATIO: "border-white/10 bg-slate-950/60 text-slate-300",
  N_MINUS_1: "border-white/10 bg-slate-950/60 text-slate-300",
  N_MINUS_K: "border-white/10 bg-slate-950/60 text-slate-300",
  INDEX_PLUS_1: "border-white/10 bg-slate-950/60 text-slate-300",
  TWO_POINTERS: "border-white/10 bg-slate-950/60 text-slate-300",
  INWARD: "border-white/10 bg-slate-950/60 text-slate-300",
  CLASSIC: "border-white/10 bg-slate-950/60 text-slate-300",
};

const TECHNIQUE_BADGE_LABELS: Record<TechniqueBadge, string> = {
  ITER: "T-ITER",
  DyV: "T-DYV",
  RyV: "T-RYV",
  RySV: "T-RYSV",
  "PD-TD": "T-DP-TD",
  "PD-BU": "T-DP-BU",
  GREEDY: "T-GREEDY",
  BT: "T-BT",
  "B&B": "T-B&B",
  FOR: "P-FOR",
  WHILE: "P-WHILE",
  NESTED: "P-NESTED",
  FLAG: "P-FLAG",
  BACKSTEP: "P-BACKSTEP",
  ACCUM: "P-ACCUM",
  TABLE: "P-TABLE",
  MEMO: "P-MEMO",
  MATRIX: "D-MATRIX",
  GRAPH: "D-GRAPH",
  TREE: "D-TREE",
  GRID: "D-GRID",
  SORT: "D-SORT",
  MERGE: "D-MERGE",
  PARTITION: "D-PARTITION",
  BOUNDARY: "D-BOUNDARY",
  SINGLE_BRANCH: "R-1-BRANCH",
  MULTI_BRANCH: "R-N-BRANCH",
  K_WAY: "R-K-WAY",
  BOUND: "R-BOUND",
  PRUNE: "R-PRUNE",
  UNDO: "R-UNDO",
  CHOICE: "R-CHOICE",
  COMMIT: "R-COMMIT",
  PRIORITY: "R-PRIORITY",
  OPTIMIZATION: "R-OPT",
  INTERVAL: "R-INTERVAL",
  MST: "R-MST",
  SHORTEST_PATH: "R-SHORTEST",
  SCHEDULING: "R-SCHED",
  TILING: "R-TILING",
  COUNTING: "R-COUNT",
  RATIO: "R-RATIO",
  N_MINUS_1: "R-N-1",
  N_MINUS_K: "R-N-K",
  INDEX_PLUS_1: "R-I+1",
  TWO_POINTERS: "R-2-PTR",
  INWARD: "R-INWARD",
  CLASSIC: "R-CLASSIC",
};

const METHOD_BADGE_LABELS: Record<RecursiveMethodBadge, string> = {
  TM: "M-TM",
  IT: "M-IT",
  AR: "M-AR",
  EC: "M-EC",
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
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const isAnalyzing = analyzingExampleId === example.id;
  const disableActions = analyzingExampleId !== null;
  const catalogItems = t.raw("examples.catalogItems") as Record<
    string,
    LocalizedExampleCatalogItem
  >;
  const copy = getLocalizedExampleContent(example, catalogItems, locale);
  const recursive = isRecursiveCategory(example.category);
  const tier: CatalogTier = example.catalogTier;
  const tierLabel =
    tier === "blocked"
      ? "Bloqueado"
      : tier === "experimental"
        ? "Experimental"
        : null;
  const kindLabel = recursive
    ? t("examples.kind.recursive")
    : t("examples.kind.iterative");
  const familyLabel = t(FAMILY_LABEL_KEYS[example.family]);
  const behaviorIcon = EXAMPLE_FAMILY_ICONS[example.family];
  const localizedSource = getLocalizedExampleSource(example, locale);

  return (
    <article
      id={`example-${example.id}`}
      className={`glass-card flex h-[322px] flex-col overflow-hidden rounded-2xl border border-white/10 p-4 transition-shadow duration-200 ${
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
                {localizedSource.split("\n").map((line, index) => (
                  <div key={`${example.id}-line-${index}`}>
                    {renderGrammarLine(line)}
                  </div>
                ))}
              </code>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2.5 text-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5">
              <span className="material-symbols-outlined text-2xl text-primary">
                {behaviorIcon}
              </span>
            </div>
            <h3 className="line-clamp-2 text-base font-semibold text-white">
              {copy.title}
            </h3>
            {showCategory && (
              <span className="mx-auto rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                {t(CATEGORY_LABEL_KEYS[example.category])}
              </span>
            )}
            <p className="line-clamp-2 w-full text-xs leading-relaxed text-dark-text">
              {copy.summary}
            </p>
            <div className="flex w-full flex-wrap justify-center gap-1.5">
              <span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                {familyLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                {kindLabel}
              </span>
              {example.techniqueBadges.map((badge) => (
                <span
                  key={badge}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${TECHNIQUE_BADGE_CLASSNAMES[badge]}`}
                >
                  {TECHNIQUE_BADGE_LABELS[badge]}
                </span>
              ))}
              {tierLabel && (
                <span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                  {tierLabel}
                </span>
              )}
              {example.verifiedMethods.map((method) => (
                <span
                  key={method}
                  title={t(getMethodTranslationKey(method))}
                  aria-label={t(getMethodTranslationKey(method))}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${METHOD_CLASSNAMES[method]}`}
                >
                  {METHOD_BADGE_LABELS[method]}
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
          disabled={disableActions || tier === "blocked"}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            className={`material-symbols-outlined text-sm ${isAnalyzing ? "animate-spin" : ""}`}
          >
            {isAnalyzing ? "progress_activity" : "play_arrow"}
          </span>
          {isAnalyzing ? analyzingLabel : analyzeLabel}
        </button>
      </div>
    </article>
  );
}
