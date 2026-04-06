"use client";

import type { LoopInvariant } from "@aa/types";
import { useTranslations } from "next-intl";
import React from "react";

import Formula from "@/components/Formula";
import InlineCodeMath from "@/components/InlineCodeMath";
import BaseModalContainer from "@/components/modals/BaseModalContainer";
import { normalizeInlineMathCandidate } from "@/lib/inline-math";

import MarkdownRenderer from "./MarkdownRenderer";

interface LoopInvariantModalProps {
  open: boolean;
  onClose: () => void;
  loopInvariant: LoopInvariant | null;
}

const statusClass: Record<LoopInvariant["status"], string> = {
  ok: "bg-emerald-500/20 text-emerald-100 border-emerald-400/40",
  low_confidence: "bg-amber-500/20 text-amber-100 border-amber-400/40",
  unavailable: "bg-red-500/20 text-red-100 border-red-400/40",
};

function fallbackInvariant(
  t: ReturnType<typeof useTranslations>,
): LoopInvariant {
  return {
    status: "unavailable",
    reason: "no_supported_loop",
    selectedLoop: {
      nodeType: null,
      lineStart: null,
      lineEnd: null,
      depth: 0,
      score: 0,
      patternType: "unknown",
      controlVariables: [],
      stateVariables: [],
      boundVariables: [],
      collectionVariables: [],
      targetVariables: [],
      keyUpdates: [],
      keyConditions: [],
    },
    invariant: {
      propertyStatement: t("fallback.property"),
      initialization: t("fallback.initialization"),
      maintenance: t("fallback.maintenance"),
      finalization: t("fallback.finalization"),
    },
    didacticSummary: t("fallback.summary"),
    evidence: {
      conditionReads: [],
      bodyWrites: [],
      bodyReads: [],
      detectedFeatures: [],
      classificationConfidence: null,
      templateVariant: null,
    },
  };
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectArrayAccessTerms(
  text: string,
  collectionVariables: string[],
): string[] {
  const found = new Set<string>();

  for (const variable of collectionVariables) {
    if (!variable.trim()) continue;
    const escaped = escapeRegExp(variable.trim());
    const accessRegex = new RegExp(`\\b${escaped}\\s*\\[[^\\]\\n]+\\]`, "g");
    let match: RegExpExecArray | null = accessRegex.exec(text);
    while (match) {
      found.add(match[0].trim());
      match = accessRegex.exec(text);
    }
  }

  // Fallback: capture any identifier[index] shape even if collectionVariables is empty/incomplete.
  const genericAccessRegex = /\b[A-Za-z_][A-Za-z0-9_]*\s*\[[^\]\n]+\]/g;
  let genericMatch: RegExpExecArray | null = genericAccessRegex.exec(text);
  while (genericMatch) {
    found.add(genericMatch[0].trim());
    genericMatch = genericAccessRegex.exec(text);
  }

  return Array.from(found);
}

function buildTermRegex(term: string): RegExp {
  const escaped = escapeRegExp(term);
  const isIdentifier = /^[A-Za-z_][A-Za-z0-9_]*$/.test(term);
  if (isIdentifier) {
    // Identifier isolation without Unicode property escapes.
    // Avoids false matches like variable `n` inside "comparación".
    const boundaryClass = "A-Za-z0-9_À-ÖØ-öø-ÿ";
    return new RegExp(
      `(^|[^${boundaryClass}])(${escaped})(?=[^${boundaryClass}]|$)`,
      "g",
    );
  }
  return new RegExp(escaped, "g");
}

type HighlightReplacement = {
  displayValue: string;
  latexValue: string | null;
};

function markHighlightTerms(
  text: string,
  terms: string[],
): {
  content: string;
  replacements: Map<string, HighlightReplacement>;
} {
  let output = text;
  const replacements = new Map<string, HighlightReplacement>();
  let counter = 0;

  const arrayTermsInText = collectArrayAccessTerms(text, []);
  const stableTerms = Array.from(
    new Set(
      [...arrayTermsInText, ...terms].filter((term) => term.trim().length > 0),
    ),
  ).sort((a, b) => {
    if (b.length !== a.length) {
      return b.length - a.length;
    }
    return a.localeCompare(b);
  });

  for (const term of stableTerms) {
    const regex = buildTermRegex(term);
    const isIdentifier = /^[A-Za-z_][A-Za-z0-9_]*$/.test(term);
    output = output.replace(
      regex,
      (match, prefix: string, isolatedValue: string) => {
        const token = `@@LI_HL_${counter}@@`;
        counter += 1;
        if (isIdentifier) {
          replacements.set(token, {
            displayValue: isolatedValue,
            latexValue: normalizeInlineMathCandidate(isolatedValue),
          });
          return `${prefix}${token}`;
        }
        replacements.set(token, {
          displayValue: match,
          latexValue: normalizeInlineMathCandidate(match),
        });
        return token;
      },
    );
  }

  return { content: output, replacements };
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

function InlineLatexText({
  text,
  className,
}: Readonly<{ text: string; className?: string }>) {
  const segments = splitMixedLatexText(text);
  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.kind === "latex-block") {
          return (
            <span
              key={`b-${index}`}
              className="my-1 inline-block max-w-full overflow-x-auto align-middle"
            >
              <Formula latex={segment.value} display />
            </span>
          );
        }
        if (segment.kind === "latex-inline") {
          return (
            <Formula
              key={`i-${index}`}
              latex={segment.value}
              className="mx-0.5 align-middle"
            />
          );
        }
        return (
          <span key={`t-${index}`} className="whitespace-pre-wrap">
            {segment.value}
          </span>
        );
      })}
    </span>
  );
}

function HighlightChip({
  displayValue,
  latexValue,
  className,
}: Readonly<{
  displayValue: string;
  latexValue: string | null;
  className: string;
}>) {
  if (latexValue) {
    return (
      <InlineCodeMath
        value={latexValue}
        asCode
        className={`${className} inline-flex max-w-full items-center overflow-x-auto align-middle leading-none not-italic`}
      />
    );
  }

  return <code className={className}>{displayValue}</code>;
}

function HighlightedInvariantText({
  content,
  terms,
  inlineHighlightClass,
}: Readonly<{
  content: string;
  terms: string[];
  inlineHighlightClass: string;
}>) {
  const { content: markedContent, replacements } = markHighlightTerms(
    content,
    terms,
  );
  const tokenPattern = /@@LI_HL_\d+@@/g;
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null = tokenPattern.exec(markedContent);

  while (match) {
    const start = match.index;
    if (start > cursor) {
      const plainText = markedContent.slice(cursor, start);
      nodes.push(<InlineLatexText key={`plain-${cursor}`} text={plainText} />);
    }

    const token = match[0];
    const replacement = replacements.get(token);
    if (replacement) {
      nodes.push(
        <HighlightChip
          key={token}
          displayValue={replacement.displayValue}
          latexValue={replacement.latexValue}
          className={inlineHighlightClass}
        />,
      );
    }

    cursor = start + token.length;
    match = tokenPattern.exec(markedContent);
  }

  if (cursor < markedContent.length) {
    nodes.push(
      <InlineLatexText
        key={`plain-${cursor}`}
        text={markedContent.slice(cursor)}
      />,
    );
  }

  return (
    <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
      {nodes}
    </div>
  );
}

export default function LoopInvariantModal({
  open,
  onClose,
  loopInvariant,
}: LoopInvariantModalProps) {
  const t = useTranslations("analyzer.loopInvariant");
  const data = loopInvariant || fallbackInvariant(t);
  const selected = data.selectedLoop;

  const variableTerms = [
    ...selected.controlVariables,
    ...selected.stateVariables,
    ...selected.boundVariables,
    ...selected.collectionVariables,
    ...selected.targetVariables,
  ];

  const evidenceCorpus = [
    data.invariant.propertyStatement,
    data.invariant.initialization,
    data.invariant.maintenance,
    data.invariant.finalization,
    ...selected.keyUpdates,
    ...selected.keyConditions,
  ].join("\n");
  const arrayAccessTerms = collectArrayAccessTerms(
    evidenceCorpus,
    selected.collectionVariables,
  );
  const termsToHighlight = [...arrayAccessTerms, ...variableTerms];

  const loopDescription = (() => {
    if (!selected.nodeType) {
      return t("labels.noLoop");
    }

    if (selected.lineStart && selected.lineEnd) {
      return t("labels.loopRange", {
        nodeType: `\`${selected.nodeType}\``,
        lineStart: `\`${selected.lineStart}\``,
        lineEnd: `\`${selected.lineEnd}\``,
      });
    }

    if (selected.lineStart) {
      return t("labels.loopStartOnly", {
        nodeType: `\`${selected.nodeType}\``,
        lineStart: `\`${selected.lineStart}\``,
      });
    }

    return t("labels.loopNoLines", { nodeType: `\`${selected.nodeType}\`` });
  })();
  const inlineHighlightClass =
    "bg-red-500/20 text-red-100 px-1 py-0.5 rounded text-[10px] font-mono font-semibold";

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={t("modal.title")}
      titleIcon="verified_user"
      titleIconClassName="text-red-400"
      sizeClassName="w-[min(90vw,860px)] max-h-[85vh]"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-300">{data.didacticSummary}</p>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold ${statusClass[data.status]}`}
          >
            {t(`status.${data.status}`)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
          <article className="bg-white/5 border border-white/10 rounded-md p-3">
            <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                category
              </span>
              {t("labels.pattern")}
            </h3>
            <p className="text-white font-medium">
              {t(`patterns.${selected.patternType}`)}
            </p>
          </article>
          <article className="bg-white/5 border border-white/10 rounded-md p-3">
            <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                repeat
              </span>
              {t("labels.selectedLoop")}
            </h3>
            <MarkdownRenderer
              content={loopDescription}
              className="text-slate-200"
              hideHorizontalRules
              inlineCodeClassName={inlineHighlightClass}
            />
          </article>
        </div>

        {data.reason && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            <span className="font-semibold">{t("labels.reason")}: </span>
            {t(`reason.${data.reason}`)}
          </div>
        )}

        <article className="bg-white/5 border border-white/10 rounded-md p-4">
          <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">
              verified
            </span>
            {t("sections.property")}
          </h3>
          <HighlightedInvariantText
            content={data.invariant.propertyStatement}
            terms={termsToHighlight}
            inlineHighlightClass={inlineHighlightClass}
          />
        </article>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <article className="bg-white/5 border border-white/10 rounded-md p-4">
            <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                play_arrow
              </span>
              {t("sections.initialization")}
            </h3>
            <HighlightedInvariantText
              content={data.invariant.initialization}
              terms={termsToHighlight}
              inlineHighlightClass={inlineHighlightClass}
            />
          </article>
          <article className="bg-white/5 border border-white/10 rounded-md p-4">
            <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                autorenew
              </span>
              {t("sections.maintenance")}
            </h3>
            <HighlightedInvariantText
              content={data.invariant.maintenance}
              terms={termsToHighlight}
              inlineHighlightClass={inlineHighlightClass}
            />
          </article>
          <article className="bg-white/5 border border-white/10 rounded-md p-4">
            <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                flag
              </span>
              {t("sections.finalization")}
            </h3>
            <HighlightedInvariantText
              content={data.invariant.finalization}
              terms={termsToHighlight}
              inlineHighlightClass={inlineHighlightClass}
            />
          </article>
        </div>
      </div>
    </BaseModalContainer>
  );
}
