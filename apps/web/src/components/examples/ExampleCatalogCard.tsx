"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";

import type {
  CatalogTier,
  ExampleCatalogItem,
  ExampleLocale,
} from "@/lib/examples/catalog";
import {
  EXAMPLE_FAMILY_ICONS,
  getLocalizedExampleSource,
  isRecursiveCategory,
} from "@/lib/examples/catalog";
import {
  CATEGORY_LABEL_KEYS,
  FAMILY_LABEL_KEYS,
  getLocalizedExampleContent,
  type LocalizedExampleCatalogItem,
} from "@/lib/examples/i18n";

const GRAMMAR_KEYWORDS = [
  "BEGIN",
  "END",
  "CLASS",
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
  "TRUE",
  "FALSE",
  "NULL",
  "LENGTH",
];

const GRAMMAR_TOKEN_REGEX = new RegExp(
  `(\\b(?:${GRAMMAR_KEYWORDS.join("|")})\\b|<-|<=|>=|!=|=|\\+|-|\\*|\\/|\\(|\\)|\\[|\\]|,|;|\\b\\d+\\b)`,
  "gi",
);

function renderGrammarLine(line: string): React.ReactNode[] {
  return line.split(GRAMMAR_TOKEN_REGEX).map((token, index) => {
    if (!token) return null;
    if (/^\d+$/.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-white">
          {token}
        </span>
      );
    }
    if (GRAMMAR_KEYWORDS.includes(token.toUpperCase())) {
      return (
        <span key={`${token}-${index}`} className="font-semibold text-cyan-300">
          {token}
        </span>
      );
    }
    if (/^(<-|<=|>=|!=|=|\+|-|\*|\/|\(|\)|\[|\]|,|;)$/.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-cyan-300">
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
              <code className="block min-w-min whitespace-pre font-mono text-[11px] leading-relaxed text-white">
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
              {tierLabel && (
                <span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                  {tierLabel}
                </span>
              )}
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
