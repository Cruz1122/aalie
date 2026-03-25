"use client";

import type { RecursiveMethodStepBundle, RecursiveStepStatus } from "@aa/types";
import { useTranslations } from "next-intl";

import Formula from "./Formula";
import BaseModalContainer from "./modals/BaseModalContainer";
import AAAnalysisStepTimeline from "./AAAnalysisStepTimeline";

interface AAAnalysisStepsModalProps {
  open: boolean;
  onClose: () => void;
  bundle: RecursiveMethodStepBundle | null | undefined;
  equation?: string | null;
  theta?: string | null;
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
}: Readonly<AAAnalysisStepsModalProps>) {
  const t = useTranslations("analyzer.analysisSteps");
  const thetaLatex = theta ? (theta.includes("T(n)") ? theta : `T(n) = ${theta}`) : null;

  if (!open) return null;

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={t("title")}
      titleIcon="list"
      closeAriaLabel={t("closeModal")}
      sizeClassName="w-[min(95vw,1200px)] max-h-[78vh]"
      panelClassName="rounded-xl bg-slate-900 ring-1 ring-white/10"
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
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-800/60 p-3">
              <div className="text-sm font-semibold text-white">
                {t("overallStatus")}
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusClassMap[bundle.overallStatus]}`}>
                {t(`status.${bundle.overallStatus}`)}
              </span>
            </div>
          )}

          {(equation || thetaLatex) && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {equation && (
                <div className="rounded-lg border border-white/10 bg-slate-800/60 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t("characteristicEquation")}</p>
                  <div className="overflow-x-auto">
                    <Formula latex={equation} display />
                  </div>
                </div>
              )}
              {thetaLatex && (
                <div className="rounded-lg border border-white/10 bg-slate-800/60 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t("finalTheta")}</p>
                  <div className="overflow-x-auto">
                    <Formula latex={thetaLatex} display />
                  </div>
                </div>
              )}
            </div>
          )}

          <AAAnalysisStepTimeline steps={bundle.steps} />
        </div>
      )}
    </BaseModalContainer>
  );
}
