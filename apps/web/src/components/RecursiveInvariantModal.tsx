"use client";

import type { RecursiveInvariant } from "@aa/types";
import { useTranslations } from "next-intl";
import React from "react";

import BaseModalContainer from "@/components/modals/BaseModalContainer";

import MarkdownRenderer from "./MarkdownRenderer";

interface RecursiveInvariantModalProps {
  open: boolean;
  onClose: () => void;
  recursiveInvariant: RecursiveInvariant | null;
}

const statusClass: Record<RecursiveInvariant["status"], string> = {
  ok: "bg-emerald-500/20 text-emerald-100 border-emerald-400/40",
  low_confidence: "bg-amber-500/20 text-amber-100 border-amber-400/40",
  unavailable: "bg-red-500/20 text-red-100 border-red-400/40",
};

function fallbackInvariant(
  t: ReturnType<typeof useTranslations>,
): RecursiveInvariant {
  return {
    status: "unavailable",
    reason: "no_recursive_calls",
    recursiveStructure: {
      baseCondition: "",
      baseResult: "",
      recursiveCallPattern: [],
    },
    invariant: {
      baseProperty: t("sections.unavailable"),
      inductiveHypothesis: "",
      recursiveStep: "",
      terminationGarantee: "",
    },
    didacticSummary: t("labels.noRecursion"),
    confidence: 0.0,
    evidence: {
      detectedRecursiveCalls: [],
      baseConditions: [],
      recursionType: "unknown",
    },
  };
}

function getRecursionTypeLabel(
  recursionType: string,
  t: ReturnType<typeof useTranslations>,
): string {
  const labels: Record<string, string> = {
    linear_recursive: t("recursionTypes.linear"),
    divide_conquer: t("recursionTypes.divideConquer"),
    multiple_recursive: t("recursionTypes.multiple"),
    unknown: t("recursionTypes.unknown"),
  };
  return labels[recursionType] || recursionType;
}

export default function RecursiveInvariantModal({
  open,
  onClose,
  recursiveInvariant,
}: RecursiveInvariantModalProps) {
  const t = useTranslations("analyzer.recursiveInvariant");
  const data = recursiveInvariant || fallbackInvariant(t);
  const structure = data.recursiveStructure;

  const recursionTypeLabel = getRecursionTypeLabel(
    data.evidence.recursionType,
    t,
  );

  const badgeClass = statusClass[data.status] || statusClass.unavailable;

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={t("title")}
      description={t("subtitle")}
      titleIcon="account_tree"
      titleIconClassName="text-cyan-400"
      sizeClassName="w-[min(90vw,860px)] max-h-[85vh]"
      dataTestId="recursive-invariant-modal"
    >
      <div className="space-y-4">
        {/* Top row: didactic summary + status badge */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p data-testid="didactic-summary" className="text-sm text-slate-300">
            {data.didacticSummary}
          </p>
          <span
            data-testid="status-badge"
            className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold ${badgeClass}`}
          >
            {t(`status.${data.status}`)}
            {data.confidence > 0 && (
              <span data-testid="confidence-score" className="ml-2 opacity-75">
                ({Math.round(data.confidence * 100)}%)
              </span>
            )}
          </span>
        </div>

        {/* Reason alert */}
        {data.reason && data.status !== "unavailable" && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            <span className="font-semibold">{t("labels.reason")}: </span>
            {t(`reasons.${data.reason}`)}
          </div>
        )}

        {/* Structure info row */}
        {data.status !== "unavailable" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <article className="bg-white/5 border border-white/10 rounded-md p-3">
              <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  account_tree
                </span>
                {t("labels.recursionType")}
              </h3>
              <p
                data-testid="recursion-type"
                className="text-sm text-slate-200"
              >
                {recursionTypeLabel}
              </p>
            </article>
            <article className="bg-white/5 border border-white/10 rounded-md p-3">
              <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  info
                </span>
                {t("sections.recursiveStructure")}
              </h3>
              <div className="space-y-1 text-sm">
                {structure.baseCondition && (
                  <div data-testid="base-condition">
                    <span className="text-gray-400 text-xs">
                      {t("labels.baseCondition")}:
                    </span>
                    <code className="ml-2 bg-black/30 px-2 py-0.5 rounded text-cyan-300 text-xs">
                      {structure.baseCondition}
                    </code>
                  </div>
                )}
                {structure.baseResult && (
                  <div data-testid="base-result">
                    <span className="text-gray-400 text-xs">
                      {t("labels.baseResult")}:
                    </span>
                    <code className="ml-2 bg-black/30 px-2 py-0.5 rounded text-cyan-300 text-xs">
                      {structure.baseResult}
                    </code>
                  </div>
                )}
                {structure.recursiveCallPattern.length > 0 && (
                  <div data-testid="recursive-calls">
                    <span className="text-gray-400 text-xs">
                      {t("labels.recursiveCalls")}:
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {structure.recursiveCallPattern.map((pattern, idx) => (
                        <code
                          key={idx}
                          className="block bg-black/30 px-2 py-0.5 rounded text-cyan-300 text-xs font-mono"
                        >
                          {pattern.calls}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          </div>
        )}

        {/* Base Property — full width */}
        {data.status !== "unavailable" && (
          <article
            data-testid="section-base-property"
            className="bg-white/5 border border-white/10 rounded-md p-4"
          >
            <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                check_circle
              </span>
              {t("sections.baseProperty")}
            </h3>
            <div className="text-sm text-gray-200 leading-relaxed">
              <MarkdownRenderer content={data.invariant.baseProperty} />
            </div>
          </article>
        )}

        {/* 3-column grid: Inductive Hypothesis | Recursive Step | Termination Guarantee */}
        {data.status !== "unavailable" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <article
              data-testid="section-inductive-hypothesis"
              className="bg-white/5 border border-white/10 rounded-md p-4"
            >
              <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  lightbulb
                </span>
                {t("sections.inductiveHypothesis")}
              </h3>
              <div className="text-sm text-gray-200 leading-relaxed">
                <MarkdownRenderer
                  content={data.invariant.inductiveHypothesis}
                />
              </div>
            </article>
            <article
              data-testid="section-recursive-step"
              className="bg-white/5 border border-white/10 rounded-md p-4"
            >
              <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  call_made
                </span>
                {t("sections.recursiveStep")}
              </h3>
              <div className="text-sm text-gray-200 leading-relaxed">
                <MarkdownRenderer content={data.invariant.recursiveStep} />
              </div>
            </article>
            <article
              data-testid="section-termination-guarantee"
              className="bg-white/5 border border-white/10 rounded-md p-4"
            >
              <h3 className="text-cyan-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  done_all
                </span>
                {t("sections.terminationGarantee")}
              </h3>
              <div className="text-sm text-gray-200 leading-relaxed">
                <MarkdownRenderer
                  content={data.invariant.terminationGarantee}
                />
              </div>
            </article>
          </div>
        )}

        {/* Evidence */}
        {data.evidence.detectedRecursiveCalls.length > 0 && (
          <details
            data-testid="evidence-section"
            className="text-sm text-gray-400"
          >
            <summary className="cursor-pointer hover:text-gray-300 font-medium">
              {t("sections.evidence")}
            </summary>
            <div className="mt-2 pl-4 space-y-2">
              <div>
                <span className="text-gray-500">
                  {t("labels.detectedCalls")}:
                </span>
                <div className="mt-1 space-y-1">
                  {data.evidence.detectedRecursiveCalls.map((call, idx) => (
                    <code
                      key={idx}
                      className="block bg-black/30 px-2 py-1 rounded text-cyan-300 text-xs"
                    >
                      {call}
                    </code>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-500">
                  {t("labels.baseConditions")}:
                </span>
                <div
                  data-testid="base-conditions-list"
                  className="mt-1 space-y-1"
                >
                  {data.evidence.baseConditions.map((cond, idx) => (
                    <code
                      key={idx}
                      className="block bg-black/30 px-2 py-1 rounded text-yellow-300 text-xs"
                    >
                      {cond}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </details>
        )}

        {/* Unavailable Message */}
        {data.status === "unavailable" && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-md p-4 text-center">
            <p className="text-sm text-red-300">{data.didacticSummary}</p>
            {data.reason && (
              <p className="text-xs text-red-400 mt-1">
                ({t(`reasons.${data.reason}`)})
              </p>
            )}
          </div>
        )}
      </div>
    </BaseModalContainer>
  );
}
