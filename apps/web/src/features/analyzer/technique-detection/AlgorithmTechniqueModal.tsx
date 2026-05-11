"use client";

import { useTranslations } from "next-intl";

import AALIEEmotionIcon from "@/components/AALIEEmotionIcon";
import BaseModalContainer from "@/components/modals/BaseModalContainer";

import { getTechniquePresentation } from "./techniquePresentation";
import type { TechniqueDetectionResult } from "./techniqueTypes";

export function AlgorithmTechniqueModal({
  open,
  onOpenChange,
  detection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detection: TechniqueDetectionResult;
}) {
  const tCommon = useTranslations("common");
  const tTechnique = useTranslations("analyzer.techniques");
  const presentation =
    getTechniquePresentation(tTechnique)[detection.technique];
  const tonePanelClassName = {
    positive: "border-emerald-400/35 bg-emerald-500/10",
    neutral: "border-white/10 bg-[rgba(24,36,49,0.94)]",
    warning: "border-amber-400/35 bg-amber-500/10",
    critical: "border-rose-400/40 bg-rose-500/10",
  }[presentation.tone];
  const tonePanelStyle = {
    positive: { background: "rgb(16 185 129 / 0.10)" },
    neutral: { background: "rgba(24,36,49,0.94)" },
    warning: { background: "rgb(245 158 11 / 0.10)" },
    critical: { background: "rgb(244 63 94 / 0.10)" },
  }[presentation.tone];

  return (
    <BaseModalContainer
      open={open}
      onClose={() => onOpenChange(false)}
      showHeader={false}
      sizeClassName="w-[min(95vw,720px)] h-[82vh]"
      panelClassName={`text-slate-100 shadow-2xl backdrop-blur-md ${tonePanelClassName}`}
      panelStyle={tonePanelStyle}
      contentClassName="relative flex h-full flex-col justify-center gap-5 p-6"
    >
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="absolute right-6 top-6 rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        title={tCommon("close")}
        aria-label={tCommon("close")}
      >
        X
      </button>

      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          {presentation.title}
        </h2>

        <AALIEEmotionIcon
          name={presentation.icon}
          size={122}
          className="mt-4 text-slate-100"
        />
      </div>

      <EvidenceCodeBlock snippet={detection.evidence.compactSnippet} />

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300/75">
          {tTechnique("modal.factsTitle")}
        </h3>
        <ul className="space-y-2 text-sm leading-6 text-slate-300">
          {detection.evidence.explanationFacts.map((fact) => (
            <li key={fact}>• {fact}</li>
          ))}
        </ul>
      </section>

      {detection.diagnostics.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300/75">
            {tTechnique("modal.diagnosticsTitle")}
          </h3>
          <ul className="space-y-2 text-sm leading-6 text-slate-300/85">
            {detection.diagnostics.map((diagnostic) => (
              <li key={diagnostic}>• {diagnostic}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-sm leading-6 text-slate-300">
        <span>{presentation.whyItMatters}</span>{" "}
        <span>{presentation.commonMistake}</span>
      </p>
    </BaseModalContainer>
  );
}

function EvidenceCodeBlock({ snippet }: { snippet: string }) {
  const tTechnique = useTranslations("analyzer.techniques");

  if (!snippet.trim()) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-300/85 shadow-inner shadow-black/10">
        {tTechnique("modal.noEvidence")}
      </div>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/45 shadow-inner shadow-black/10 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2">
        <span className="text-xs font-medium text-slate-300">
          {tTechnique("modal.evidenceTitle")}
        </span>
      </div>

      <pre className="scrollbar-custom max-h-[24vh] overflow-auto px-4 py-3 text-xs leading-5 text-slate-200">
        <code>{snippet}</code>
      </pre>
    </figure>
  );
}
