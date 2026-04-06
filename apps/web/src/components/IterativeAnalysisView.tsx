"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import { useTranslations } from "next-intl";
import React from "react";

import { getBestAsymptoticNotation } from "@/lib/asymptotic-notation";

import Formula from "./Formula";
import LineTable from "./LineTable";

type CaseType = "worst" | "best" | "average";

/**
 * Propiedades del componente IterativeAnalysisView.
 */
interface IterativeAnalysisViewProps {
  /** Datos de análisis para worst, best y average case */
  data: {
    worst: AnalyzeOpenResponse | null;
    best: AnalyzeOpenResponse | "same_as_worst" | null;
    avg: AnalyzeOpenResponse | "same_as_worst" | null;
  } | null;
  /** Caso actualmente seleccionado */
  selectedCase: CaseType;
  /** Callback para cambiar el caso seleccionado */
  onCaseChange: (caseType: CaseType) => void;
  /** Callback para ver el procedimiento de una línea específica */
  onViewLineProcedure: (line: number, caseType: CaseType) => void;
  /** Callback para ver el procedimiento general */
  onViewGeneralProcedure: (caseType: CaseType) => void;
}

/**
 * Obtiene las clases CSS para el badge de un tipo de caso.
 * @param caseType - Tipo de caso (worst, best, average)
 * @returns String con las clases CSS para el badge
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const getCaseBadgeStyle = (caseType: CaseType): string => {
  switch (caseType) {
    case "worst":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "best":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case "average":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
  }
};

/**
 * Obtiene las clases CSS para el botón selector de caso.
 * @param caseType - Tipo de caso (worst, best, average)
 * @param isSelected - Indica si el caso está seleccionado
 * @returns String con las clases CSS para el botón
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
/** Longitud máxima de notación para mostrar la bolita; si es mayor, se oculta para evitar desborde. */
const NOTATION_LENGTH_FOR_CIRCLE = 16;

const getSelectorButtonStyle = (
  caseType: CaseType,
  isSelected: boolean,
): string => {
  const baseStyle = "transition-colors text-xs font-semibold";
  if (isSelected) {
    switch (caseType) {
      case "worst":
        return `${baseStyle} bg-red-500/30 text-red-200 border border-red-500/50`;
      case "best":
        return `${baseStyle} bg-green-500/30 text-green-200 border border-green-500/50`;
      case "average":
        return `${baseStyle} bg-yellow-500/30 text-yellow-200 border border-yellow-500/50`;
    }
  }
  return `${baseStyle} text-slate-400 hover:text-slate-200`;
};

/**
 * Componente principal para visualizar el análisis de algoritmos iterativos.
 * Muestra la tabla de costos por línea y las ecuaciones de eficiencia para cada caso
 * (worst, best, average), permitiendo cambiar entre casos y ver procedimientos detallados.
 *
 * @param props - Propiedades del componente
 * @returns Componente React con la visualización del análisis iterativo
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```tsx
 * <IterativeAnalysisView
 *   data={{
 *     worst: worstCaseData,
 *     best: bestCaseData,
 *     avg: avgCaseData
 *   }}
 *   selectedCase="worst"
 *   onCaseChange={(caseType) => setSelectedCase(caseType)}
 *   onViewLineProcedure={(line, caseType) => handleViewLine(line, caseType)}
 *   onViewGeneralProcedure={(caseType) => handleViewGeneral(caseType)}
 * />
 * ```
 */
export default function IterativeAnalysisView({
  data,
  selectedCase,
  onCaseChange,
  onViewLineProcedure,
  onViewGeneralProcedure,
}: IterativeAnalysisViewProps) {
  const t = useTranslations("analyzer.cases");
  const tView = useTranslations("analyzer.view");

  const getCaseLabel = (caseType: CaseType) => t(caseType);
  const getCaseShortLabel = (caseType: CaseType) =>
    caseType === "best"
      ? t("bestShort")
      : caseType === "average"
        ? t("avgShort")
        : t("worstShort");

  /**
   * Renderiza el contenido de la tabla de costos por línea.
   * @returns Elemento React con la tabla de costos o estado vacío
   * @author Juan Camilo Cruz Parra (@Cruz1122)
   */
  const renderLineCostContent = () => {
    if (!data || (!data.worst && !data.best && !data.avg)) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl mb-2 block">
              table_chart
            </span>
            <p>{tView("runAnalysisToSeeCosts")}</p>
          </div>
        </div>
      );
    }

    // Resolver currentData: si best/avg es "same_as_worst", usar worst
    let currentData: AnalyzeOpenResponse | null = null;
    if (selectedCase === "worst") {
      currentData = data?.worst ?? null;
    } else if (selectedCase === "best") {
      const bestData = data?.best;
      currentData =
        bestData === "same_as_worst"
          ? (data?.worst ?? null)
          : (bestData ?? null);
    } else if (selectedCase === "average") {
      const avgData = data?.avg;
      currentData =
        avgData === "same_as_worst" ? (data?.worst ?? null) : (avgData ?? null);
    }

    if (!currentData || !currentData.ok) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl mb-2 block">
              hourglass_empty
            </span>
            <p>
              {tView("caseAvailableSoon", { case: getCaseLabel(selectedCase) })}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className="overflow-auto scrollbar-custom"
        style={{ height: "285px" }}
      >
        <LineTable
          rows={currentData.byLine}
          onViewProcedure={(line) => onViewLineProcedure(line, selectedCase)}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Card de costos por línea */}
      <div className="glass-card p-4 rounded-lg h-full flex flex-col min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 min-w-0">
          <h2 className="text-white font-semibold flex items-center gap-2 flex-wrap min-w-0">
            <span className="material-symbols-outlined text-amber-400 flex-shrink-0">
              table_chart
            </span>
            <span className="truncate">{tView("costsPerLine")}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border tracking-wide flex-shrink-0 ${getCaseBadgeStyle(selectedCase)}`}
            >
              {getCaseLabel(selectedCase)}
            </span>
          </h2>
          <div className="flex items-center justify-center gap-1 bg-slate-800/60 border border-white/10 rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => onCaseChange("best")}
              className={`px-2 py-1 text-xs rounded-md ${getSelectorButtonStyle("best", selectedCase === "best")}`}
            >
              {getCaseShortLabel("best")}
            </button>
            <button
              onClick={() => onCaseChange("average")}
              className={`px-2 py-1 text-xs rounded-md ${getSelectorButtonStyle("average", selectedCase === "average")}`}
            >
              {getCaseShortLabel("average")}
            </button>
            <button
              onClick={() => onCaseChange("worst")}
              className={`px-2 py-1 text-xs rounded-md ${getSelectorButtonStyle("worst", selectedCase === "worst")}`}
            >
              {getCaseShortLabel("worst")}
            </button>
          </div>
        </div>
        <div className="flex flex-col" style={{ height: "285px" }}>
          {renderLineCostContent()}
        </div>
      </div>

      {/* Card de ecuaciones matemáticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
        <div className="glass-card p-4 rounded-lg text-center shadow-[0_8px_32px_0_rgba(34,197,94,0.3)] hover:shadow-[0_12px_40px_0_rgba(34,197,94,0.4)] min-w-0">
          <div className="h-full flex flex-col items-center justify-center gap-2 min-w-0">
            {(() => {
              const bestNotation = getBestAsymptoticNotation(
                "best",
                data?.best === "same_as_worst"
                  ? data?.worst?.totals || {}
                  : data?.best?.totals || {},
              ).notation;
              const showCircle =
                bestNotation.length <= NOTATION_LENGTH_FOR_CIRCLE;
              return showCircle ? (
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 shrink-0">
                  <div className="scale-110">
                    <Formula latex={bestNotation} />
                  </div>
                </div>
              ) : (
                <div className="min-h-16 min-w-0 w-full overflow-hidden flex justify-center items-center py-2">
                  <Formula latex={bestNotation} />
                </div>
              );
            })()}
            <h3 className="font-semibold text-green-300 mb-0.5">
              {getCaseLabel("best")}
            </h3>
            <p className="text-[10px] text-green-400/80 italic -mt-3 mb-1">
              {t("bestHint")}
            </p>
            {getBestAsymptoticNotation(
              "best",
              data?.best === "same_as_worst"
                ? data?.worst?.totals || {}
                : data?.best?.totals || {},
            ).chips.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {getBestAsymptoticNotation(
                  "best",
                  data?.best === "same_as_worst"
                    ? data?.worst?.totals || {}
                    : data?.best?.totals || {},
                ).chips.map((chip, idx) => (
                  <span
                    key={idx}
                    className={`text-[9px] px-1.5 py-0.5 rounded border ${
                      chip.type === "hypothesis" || chip.type === "conditional"
                        ? "bg-amber-500/20 text-amber-200 border-amber-500/30"
                        : chip.type === "model"
                          ? "bg-blue-500/20 text-blue-200 border-blue-500/30"
                          : "bg-slate-500/20 text-slate-300 border-slate-500/30"
                    }`}
                    title={
                      chip.type === "bound-only"
                        ? tView("boundOnly")
                        : undefined
                    }
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => onViewGeneralProcedure("best")}
              disabled={
                !(data?.best === "same_as_worst"
                  ? data?.worst?.ok
                  : data?.best?.ok)
              }
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-colors min-w-0 ${
                (
                  data?.best === "same_as_worst"
                    ? data?.worst?.ok
                    : data?.best?.ok
                )
                  ? "text-white glass-secondary hover:bg-sky-500/20"
                  : "text-slate-400 border border-white/10 bg-white/5 cursor-not-allowed opacity-60"
              }`}
              title={
                (
                  data?.best === "same_as_worst"
                    ? data?.worst?.ok
                    : data?.best?.ok
                )
                  ? tView("viewProcedureGeneral", {
                      case: getCaseLabel("best"),
                    })
                  : tView("runAnalysisToSeeProcedure")
              }
            >
              <span className="material-symbols-outlined text-sm flex-shrink-0">
                visibility
              </span>
              <span className="truncate">{tView("viewProcedure")}</span>
            </button>
          </div>
        </div>
        <div className="glass-card p-4 rounded-lg text-center shadow-[0_8px_32px_0_rgba(234,179,8,0.3)] hover:shadow-[0_12px_40px_0_rgba(234,179,8,0.4)] relative min-w-0">
          {data?.avg &&
            typeof data.avg !== "string" &&
            data.avg.totals?.avg_model_info && (
              <div className="absolute top-2 right-2 group">
                <button
                  className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30 flex items-center justify-center text-xs font-semibold transition-colors"
                  title={data.avg.totals.avg_model_info.note}
                >
                  ?
                </button>
                <div className="absolute right-0 top-6 w-48 p-2 bg-slate-800 border border-yellow-500/30 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-xs text-left">
                  <div className="text-yellow-300 font-semibold mb-1">
                    {tView("model")}:
                  </div>
                  <div className="text-slate-300">
                    {data.avg.totals.avg_model_info.note}
                  </div>
                </div>
              </div>
            )}
          <div className="h-full flex flex-col items-center justify-center gap-2 min-w-0">
            {(() => {
              const avgNotation = getBestAsymptoticNotation(
                "average",
                data?.avg === "same_as_worst"
                  ? data?.worst?.totals || {}
                  : data?.avg?.totals || {},
              ).notation;
              const showCircle =
                avgNotation.length <= NOTATION_LENGTH_FOR_CIRCLE;
              return showCircle ? (
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 shrink-0">
                  <div className="scale-110">
                    <Formula latex={avgNotation} />
                  </div>
                </div>
              ) : (
                <div className="min-h-16 min-w-0 w-full overflow-hidden flex justify-center items-center py-2">
                  <Formula latex={avgNotation} />
                </div>
              );
            })()}
            <h3 className="font-semibold text-yellow-300 mb-0.5">
              {getCaseLabel("average")}
            </h3>
            <p className="text-[10px] text-yellow-400/80 italic -mt-3 mb-1">
              {t("averageHint")}
            </p>
            <button
              onClick={() => onViewGeneralProcedure("average")}
              disabled={
                !(data?.avg === "same_as_worst"
                  ? data?.worst?.ok
                  : data?.avg?.ok)
              }
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-colors min-w-0 ${
                (
                  data?.avg === "same_as_worst"
                    ? data?.worst?.ok
                    : data?.avg?.ok
                )
                  ? "text-white glass-secondary hover:bg-sky-500/20"
                  : "text-slate-400 border border-white/10 bg-white/5 cursor-not-allowed opacity-60"
              }`}
              title={
                (
                  data?.avg === "same_as_worst"
                    ? data?.worst?.ok
                    : data?.avg?.ok
                )
                  ? tView("viewProcedureGeneral", {
                      case: getCaseLabel("average"),
                    })
                  : tView("runAnalysisToSeeProcedure")
              }
            >
              <span className="material-symbols-outlined text-sm flex-shrink-0">
                visibility
              </span>
              <span className="truncate">{tView("viewProcedure")}</span>
            </button>
          </div>
        </div>
        <div className="glass-card p-4 rounded-lg text-center shadow-[0_8px_32px_0_rgba(239,68,68,0.3)] hover:shadow-[0_12px_40px_0_rgba(239,68,68,0.4)] min-w-0">
          <div className="h-full flex flex-col items-center justify-center gap-2 min-w-0">
            {(() => {
              const worstNotation = getBestAsymptoticNotation(
                "worst",
                data?.worst?.totals || {},
              ).notation;
              const showCircle =
                worstNotation.length <= NOTATION_LENGTH_FOR_CIRCLE;
              return showCircle ? (
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 shrink-0">
                  <div className="scale-110">
                    <Formula latex={worstNotation} />
                  </div>
                </div>
              ) : (
                <div className="min-h-16 min-w-0 w-full overflow-hidden flex justify-center items-center py-2">
                  <Formula latex={worstNotation} />
                </div>
              );
            })()}
            <h3 className="font-semibold text-red-300 mb-0.5">
              {getCaseLabel("worst")}
            </h3>
            <p className="text-[10px] text-red-400/80 italic -mt-3 mb-1">
              {t("worstHint")}
            </p>
            {getBestAsymptoticNotation("worst", data?.worst?.totals || {}).chips
              .length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {getBestAsymptoticNotation(
                  "worst",
                  data?.worst?.totals || {},
                ).chips.map((chip, idx) => (
                  <span
                    key={idx}
                    className={`text-[9px] px-1.5 py-0.5 rounded border ${
                      chip.type === "hypothesis" || chip.type === "conditional"
                        ? "bg-amber-500/20 text-amber-200 border-amber-500/30"
                        : chip.type === "model"
                          ? "bg-blue-500/20 text-blue-200 border-blue-500/30"
                          : "bg-slate-500/20 text-slate-300 border-slate-500/30"
                    }`}
                    title={
                      chip.type === "bound-only"
                        ? tView("boundOnly")
                        : undefined
                    }
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => onViewGeneralProcedure("worst")}
              disabled={!data?.worst?.ok}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-colors min-w-0 ${
                data?.worst?.ok
                  ? "text-white glass-secondary hover:bg-sky-500/20"
                  : "text-slate-400 border border-white/10 bg-white/5 cursor-not-allowed opacity-60"
              }`}
              title={
                data?.worst?.ok
                  ? tView("viewProcedureGeneral", {
                      case: getCaseLabel("worst"),
                    })
                  : tView("runAnalysisToSeeProcedure")
              }
            >
              <span className="material-symbols-outlined text-sm flex-shrink-0">
                visibility
              </span>
              <span className="truncate">{tView("viewProcedure")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
