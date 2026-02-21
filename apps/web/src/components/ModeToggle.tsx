"use client";

import { useTranslations } from "next-intl";

import AALIEIcon from "./AALIEIcon";

interface ModeToggleProps {
  readonly mode: "ai" | "manual";
  readonly isSwitching: boolean;
  readonly onModeSwitch: (mode: "ai" | "manual") => void;
}

export default function ModeToggle({
  mode,
  isSwitching,
  onModeSwitch,
}: ModeToggleProps) {
  const t = useTranslations("home");
  return (
    <div className="flex justify-center mb-4 sm:mb-8">
      <div className="inline-flex items-center justify-center bg-slate-800/60 border border-slate-600/50 rounded-xl p-1 gap-1">
        <button
          onClick={() => onModeSwitch("ai")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
            mode === "ai"
              ? "bg-purple-500/20 text-white border border-purple-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
          disabled={isSwitching}
        >
          <AALIEIcon className="text-base flex-shrink-0" size={24} />
          <span className="truncate max-w-[70px] sm:max-w-none">{t("modeAI")}</span>
        </button>
        <button
          onClick={() => onModeSwitch("manual")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
            mode === "manual"
              ? "bg-blue-500/20 text-white border border-blue-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
          disabled={isSwitching}
        >
          <span className="material-symbols-outlined text-base flex-shrink-0">terminal</span>
          <span className="truncate max-w-[70px] sm:max-w-none">{t("modeManual")}</span>
        </button>
      </div>
    </div>
  );
}
