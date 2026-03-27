"use client";

import type { LoopInvariant } from "@aa/types";
import { useTranslations } from "next-intl";

import BaseModalContainer from "@/components/modals/BaseModalContainer";

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

function highlightTerms(text: string, terms: string[]): string {
  let output = text;
  const replacements = new Map<string, string>();
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
          replacements.set(token, `\`${isolatedValue}\``);
          return `${prefix}${token}`;
        }
        replacements.set(token, `\`${match}\``);
        return token;
      },
    );
  }

  for (const [token, highlighted] of replacements.entries()) {
    output = output.replaceAll(token, highlighted);
  }

  return output;
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

  const propertyStatement = highlightTerms(
    data.invariant.propertyStatement,
    termsToHighlight,
  );
  const initialization = highlightTerms(
    data.invariant.initialization,
    termsToHighlight,
  );
  const maintenance = highlightTerms(
    data.invariant.maintenance,
    termsToHighlight,
  );
  const finalization = highlightTerms(
    data.invariant.finalization,
    termsToHighlight,
  );
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
          <MarkdownRenderer
            content={propertyStatement}
            className="text-slate-200"
            hideHorizontalRules
            inlineCodeClassName={inlineHighlightClass}
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
            <MarkdownRenderer
              content={initialization}
              className="text-slate-200"
              hideHorizontalRules
              inlineCodeClassName={inlineHighlightClass}
            />
          </article>
          <article className="bg-white/5 border border-white/10 rounded-md p-4">
            <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                autorenew
              </span>
              {t("sections.maintenance")}
            </h3>
            <MarkdownRenderer
              content={maintenance}
              className="text-slate-200"
              hideHorizontalRules
              inlineCodeClassName={inlineHighlightClass}
            />
          </article>
          <article className="bg-white/5 border border-white/10 rounded-md p-4">
            <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                flag
              </span>
              {t("sections.finalization")}
            </h3>
            <MarkdownRenderer
              content={finalization}
              className="text-slate-200"
              hideHorizontalRules
              inlineCodeClassName={inlineHighlightClass}
            />
          </article>
        </div>
      </div>
    </BaseModalContainer>
  );
}
