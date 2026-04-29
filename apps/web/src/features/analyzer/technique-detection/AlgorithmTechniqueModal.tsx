"use client";

import { useTranslations } from "next-intl";

import AALIEEmotionIcon from "@/components/AALIEEmotionIcon";
import BaseModalContainer from "@/components/modals/BaseModalContainer";

import { getTechniquePresentation } from "./techniquePresentation";
import type {
  TechniqueDetectionResult,
  TechniqueEvidenceSnippet,
} from "./techniqueTypes";

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
      contentClassName="relative flex h-full flex-col justify-center gap-6 p-6"
    >
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="absolute right-6 top-6 text-slate-300 transition-colors hover:bg-white/10 hover:text-white rounded-lg p-2"
        title={tCommon("close")}
        aria-label={tCommon("close")}
      >
        ✕
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

      <EvidenceCodeBlock snippet={detection.evidenceSnippet} />

      <p className="text-sm leading-6 text-slate-300">
        {detection.explanation}
      </p>

      <p className="text-sm leading-6 text-slate-300">
        <span>{presentation.whyItMatters}</span>{" "}
        <span>{presentation.commonMistake}</span>
      </p>
    </BaseModalContainer>
  );
}

function EvidenceCodeBlock({ snippet }: { snippet: TechniqueEvidenceSnippet }) {
  const tTechnique = useTranslations("analyzer.techniques");

  if (!snippet || snippet.kind === "none" || !snippet.code.trim()) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-slate-400">
        {tTechnique("modal.noEvidence")}
      </div>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs font-medium text-slate-300">
          {tTechnique("modal.evidenceTitle")}
        </span>

        {snippet.startLine ? (
          <span className="text-[11px] text-slate-500">
            {tTechnique("modal.lineLabel", {
              start: snippet.startLine,
              end:
                snippet.endLine && snippet.endLine !== snippet.startLine
                  ? `–${snippet.endLine}`
                  : "",
            })}
          </span>
        ) : null}
      </div>

      <pre className="max-h-[24vh] overflow-auto px-4 py-3 text-xs leading-5 text-slate-200">
        <code>{snippet.code}</code>
      </pre>

      {snippet.omittedBody ? (
        <figcaption className="border-t border-white/10 px-4 py-2 text-[11px] text-slate-500">
          {tTechnique("modal.omittedBody")}
        </figcaption>
      ) : null}
    </figure>
  );
}
