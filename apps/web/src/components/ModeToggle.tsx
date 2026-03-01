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
      <div className="relative inline-flex items-stretch bg-slate-800/60 border border-slate-600/50 rounded-xl p-1 gap-1">
        {/* Sliding pill: se mueve según el modo activo; ancho 50% menos 4px para no tocar el borde derecho */}
        <div
          className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg transition-[transform,background-color,border-color] duration-300 ease-out"
          style={{
            left: 4,
            transform: mode === "manual" ? "translateX(100%)" : "translateX(0)",
            backgroundColor: mode === "ai" ? "rgb(126 34 206 / 0.2)" : "rgb(59 130 246 / 0.2)",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: mode === "ai" ? "rgb(126 34 206 / 0.3)" : "rgb(59 130 246 / 0.3)",
          }}
          aria-hidden
        />
        <button
          type="button"
          onClick={() => onModeSwitch("ai")}
          className="relative z-10 flex flex-1 items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 disabled:opacity-60 disabled:pointer-events-none"
          style={{ color: mode === "ai" ? "white" : undefined }}
          disabled={isSwitching}
        >
          <AALIEIcon className="text-base flex-shrink-0" size={24} />
          <span className={`truncate max-w-[70px] sm:max-w-none ${mode === "ai" ? "text-white" : "text-slate-400 hover:text-slate-200"}`}>
            {t("modeAI")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onModeSwitch("manual")}
          className="relative z-10 flex flex-1 items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 disabled:opacity-60 disabled:pointer-events-none"
          style={{ color: mode === "manual" ? "white" : undefined }}
          disabled={isSwitching}
        >
          <span className="material-symbols-outlined text-base flex-shrink-0">terminal</span>
          <span className={`whitespace-nowrap ${mode === "manual" ? "text-white" : "text-slate-400 hover:text-slate-200"}`}>
            {t("modeManual")}
          </span>
        </button>
      </div>
    </div>
  );
}
