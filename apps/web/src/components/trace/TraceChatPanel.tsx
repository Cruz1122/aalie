"use client";

import { useTranslations } from "next-intl";

import PseudocodeViewer from "./PseudocodeViewer";

/**
 * Panel tipo chat bloqueado que muestra el pseudocódigo con progreso por línea.
 * Replica dimensiones del chat del analyzer pero sin input, solo lectura.
 *
 * @author AALIE
 * @version 0.1.0
 */
interface TraceChatPanelProps {
  source: string;
  currentLine?: number;
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
}

export default function TraceChatPanel({
  source,
  currentLine,
  currentStep = 0,
  totalSteps = 0,
  onBack,
}: TraceChatPanelProps) {
  const t = useTranslations("analyzer.executionTrace");

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label={t("back")}
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="text-xs font-medium hidden sm:inline">{t("back")}</span>
            </button>
          )}
          <h3 className="text-sm font-semibold text-slate-300 truncate">
            {t("pseudocode")}
          </h3>
        </div>
        {totalSteps > 0 && (
          <span className="text-xs text-slate-500 tabular-nums flex-shrink-0">
            {t("stepProgress", {
              current: currentStep + 1,
              total: totalSteps,
            })}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden border-t border-white/10 pt-2">
        <PseudocodeViewer
          source={source}
          currentLine={currentLine}
          hideHeader
        />
      </div>
    </div>
  );
}
