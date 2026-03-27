"use client";

import type { RecursiveMethodStepBundle, RecursiveStepStatus } from "@aa/types";
import { useTranslations } from "next-intl";

import AAAnalysisStepTimeline from "./AAAnalysisStepTimeline";
import Formula from "./Formula";
import BaseModalContainer from "./modals/BaseModalContainer";

interface AAAnalysisStepsModalProps {
  open: boolean;
  onClose: () => void;
  bundle: RecursiveMethodStepBundle | null | undefined;
  equation?: string | null;
  theta?: string | null;
  equationLabelKey?: "characteristicEquation" | "recurrenceEquation";
}

const statusClassMap: Record<RecursiveStepStatus, string> = {
  complete: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  partial: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  unsupported: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  error: "bg-red-500/20 text-red-200 border-red-500/40",
};

export default function AAAnalysisStepsModal({
  open,
  onClose,
  bundle,
  equation,
  theta,
  equationLabelKey = "recurrenceEquation",
}: Readonly<AAAnalysisStepsModalProps>) {
  const t = useTranslations("analyzer.analysisSteps");
  const thetaLatex = theta
    ? theta.includes("T(n)")
      ? theta
      : `T(n) = ${theta}`
    : null;
  const isIteration = bundle?.method === "iteration";
  const isMaster = bundle?.method === "master";
  const isRecursionTree = bundle?.method === "recursion_tree";
  const titleIconClassName = isIteration
    ? "text-violet-400"
    : isRecursionTree
      ? "text-cyan-400"
      : isMaster
        ? "text-orange-400"
        : "text-blue-400";
  const panelClassName = isIteration
    ? "rounded-xl bg-violet-950/55 ring-1 ring-violet-400/20"
    : isRecursionTree
      ? "rounded-xl bg-cyan-950/30 ring-1 ring-cyan-400/25"
      : isMaster
        ? "rounded-xl bg-orange-950/45 ring-1 ring-orange-400/25"
        : "rounded-xl bg-slate-900 ring-1 ring-white/10";
  const equationCardClassName =
    "rounded-lg border border-white/10 bg-slate-800/60 p-3";
  const overallStatusCardClassName =
    "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-800/60 p-3";
  const accent: "blue" | "purple" | "orange" | "cyan" = isIteration
    ? "purple"
    : isRecursionTree
      ? "cyan"
      : isMaster
        ? "orange"
        : "blue";

  if (!open) return null;

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={t("title")}
      titleIcon="list"
      titleIconClassName={titleIconClassName}
      closeAriaLabel={t("closeModal")}
      sizeClassName="w-[min(95vw,1200px)] max-h-[78vh]"
      panelClassName={panelClassName}
      headerClassName="p-4"
      contentClassName="p-6"
    >
      {!bundle ? (
        <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-400">
          {t("noSteps")}
        </div>
      ) : (
        <div className="space-y-4">
          {bundle.overallStatus !== "complete" && (
            <div className={overallStatusCardClassName}>
              <div className="text-sm font-semibold text-white">
                {t("overallStatus")}
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusClassMap[bundle.overallStatus]}`}
              >
                {t(`status.${bundle.overallStatus}`)}
              </span>
            </div>
          )}

          {(equation || thetaLatex) && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {equation && (
                <div className={equationCardClassName}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t(equationLabelKey)}
                  </p>
                  <div className="overflow-x-auto">
                    <Formula latex={equation} display />
                  </div>
                </div>
              )}
              {thetaLatex && (
                <div className={equationCardClassName}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t("finalTheta")}
                  </p>
                  <div className="overflow-x-auto">
                    <Formula latex={thetaLatex} display />
                  </div>
                </div>
              )}
            </div>
          )}

          <AAAnalysisStepTimeline steps={bundle.steps} accent={accent} />
        </div>
      )}
    </BaseModalContainer>
  );
}
