"use client";

import { useTranslations } from "next-intl";

import type { CaseType, TraceConfig } from "@/types/trace";

interface TraceToolbarProps {
  caseType: CaseType;
  onCaseChange: (caseType: CaseType) => void;
  onReload: () => void;
  onExpand?: () => void;
  loading: boolean;
  traceConfig: TraceConfig;
  variant?: "iterative" | "recursive";
  showActions?: boolean;
}

/**
 * Barra de herramientas del trace: selector de caso, recargar, expandir.
 * Extrae controles de StructuredTraceContent (traza estructurada).
 *
 * @author Plan refactor subsistema trace (Bloque G)
 * @version 0.1.0
 */
export default function TraceToolbar({
  caseType,
  onCaseChange,
  onReload,
  onExpand,
  loading,
  traceConfig,
  variant: _variant = "iterative",
  showActions = true,
}: TraceToolbarProps) {
  const t = useTranslations("analyzer.executionTrace");
  const tCases = useTranslations("analyzer.cases");

  const caseSelector = traceConfig?.controls?.scenario && (
    <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-lg p-1 flex-shrink-0">
      <button
        onClick={() => onCaseChange("best")}
        className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${
          caseType === "best"
            ? "bg-green-500/30 text-green-200 border border-green-500/50"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {tCases("bestShort")}
      </button>
      <button
        onClick={() => onCaseChange("avg")}
        className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${
          caseType === "avg"
            ? "bg-yellow-500/30 text-yellow-200 border border-yellow-500/50"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {tCases("avgShort")}
      </button>
      <button
        onClick={() => onCaseChange("worst")}
        className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${
          caseType === "worst"
            ? "bg-red-500/30 text-red-200 border border-red-500/50"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {tCases("worstShort")}
      </button>
    </div>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {caseSelector}
      {showActions && (
        <>
          <button
            onClick={onReload}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t("reloadTrace")}
            aria-label={t("reloadTrace")}
          >
            <span className="material-symbols-outlined text-sm text-slate-200 leading-none">
              refresh
            </span>
          </button>
          {onExpand && (
            <button
              onClick={onExpand}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60 transition-colors"
              title={t("expandDiagram")}
              aria-label={t("expandDiagram")}
            >
              <span className="material-symbols-outlined text-sm text-slate-200 leading-none">
                fullscreen
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
