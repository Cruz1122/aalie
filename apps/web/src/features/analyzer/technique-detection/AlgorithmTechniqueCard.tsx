import { useTranslations } from "next-intl";

import AALIEEmotionIcon from "@/components/AALIEEmotionIcon";

import { getTechniquePresentation } from "./techniquePresentation";
import type { TechniqueDetectionResult } from "./techniqueTypes";

const toneStyles = {
  positive: "border-emerald-400/35 bg-emerald-500/10 text-emerald-50",
  neutral: "border-white/10 bg-[rgba(24,36,49,0.94)] text-slate-100",
  warning: "border-amber-400/35 bg-amber-500/10 text-amber-50",
  critical: "border-rose-400/40 bg-rose-500/10 text-rose-50",
};

export function AlgorithmTechniqueCard({
  detection,
  onOpenDetails,
}: {
  detection: TechniqueDetectionResult;
  onOpenDetails: () => void;
}) {
  const tTechnique = useTranslations("analyzer.techniques");
  const presentation =
    getTechniquePresentation(tTechnique)[detection.technique];

  return (
    <aside
      className={[
        "absolute bottom-3 left-6 right-6 z-20",
        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
        "shadow-2xl backdrop-blur-md transition-colors",
        toneStyles[presentation.tone],
      ].join(" ")}
    >
      <AALIEEmotionIcon
        name={presentation.icon}
        size={30}
        className="text-current"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{presentation.title}</p>
        <p className="truncate text-[11px] leading-4 opacity-85">
          {presentation.shortMessage}
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenDetails}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
        aria-label={tTechnique("openDetailsAriaLabel")}
      >
        <span className="material-symbols-outlined text-base">help</span>
      </button>
    </aside>
  );
}
