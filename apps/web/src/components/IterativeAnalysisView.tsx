"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
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
 * Obtiene la etiqueta en español para un tipo de caso.
 * @param caseType - Tipo de caso (worst, best, average)
 * @returns Etiqueta en español del caso
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const getCaseLabel = (caseType: CaseType): string => {
  switch (caseType) {
    case "worst":
      return "Peor caso";
    case "best":
      return "Mejor caso";
    case "average":
      return "Caso promedio";
  }
};

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
            <p>Ejecuta el análisis para ver los costos</p>
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
      currentData = bestData === "same_as_worst" ? data?.worst ?? null : (bestData ?? null);
    } else if (selectedCase === "average") {
      const avgData = data?.avg;
      currentData = avgData === "same_as_worst" ? data?.worst ?? null : (avgData ?? null);
    }

    if (!currentData || !currentData.ok) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl mb-2 block">
              hourglass_empty
            </span>
            <p>
              El caso &quot;{getCaseLabel(selectedCase)}&quot; estará disponible
              próximamente
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
    <>
      {/* Card de costos por línea */}
      <div className="glass-card p-4 rounded-lg h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined mr-2 text-amber-400">
              table_chart
            </span>
            <span>Costos por Línea</span>
            <span
              className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border tracking-wide ${getCaseBadgeStyle(selectedCase)}`}
            >
              {getCaseLabel(selectedCase)}
            </span>
          </h2>
          <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => onCaseChange("best")}
              className={`px-2 py-1 text-xs rounded-md ${getSelectorButtonStyle("best", selectedCase === "best")}`}
            >
              Mejor
            </button>
            <button
              onClick={() => onCaseChange("average")}
              className={`px-2 py-1 text-xs rounded-md ${getSelectorButtonStyle("average", selectedCase === "average")}`}
            >
              Promedio
            </button>
            <button
              onClick={() => onCaseChange("worst")}
              className={`px-2 py-1 text-xs rounded-md ${getSelectorButtonStyle("worst", selectedCase === "worst")}`}
            >
              Peor
            </button>
          </div>
        </div>
        <div className="flex flex-col" style={{ height: "285px" }}>
          {renderLineCostContent()}
        </div>
      </div>

      {/* Card de ecuaciones matemáticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-lg text-center shadow-[0_8px_32px_0_rgba(34,197,94,0.3)] hover:shadow-[0_12px_40px_0_rgba(34,197,94,0.4)]">
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <div className="scale-110">
                <Formula
                  latex={
                    getBestAsymptoticNotation("best", 
                      data?.best === "same_as_worst" 
                        ? data?.worst?.totals || {} 
                        : data?.best?.totals || {}
                    ).notation
                  }
                />
              </div>
            </div>
            <h3 className="font-semibold text-green-300 mb-1">Mejor caso</h3>
            {getBestAsymptoticNotation("best", 
              data?.best === "same_as_worst" 
                ? data?.worst?.totals || {} 
                : data?.best?.totals || {}
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
                        ? "Solo se conoce esta cota"
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
              disabled={!(data?.best === "same_as_worst" ? data?.worst?.ok : data?.best?.ok)}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-colors ${
                (data?.best === "same_as_worst" ? data?.worst?.ok : data?.best?.ok)
                  ? "text-white glass-secondary hover:bg-sky-500/20"
                  : "text-slate-400 border border-white/10 bg-white/5 cursor-not-allowed opacity-60"
              }`}
              title={
                (data?.best === "same_as_worst" ? data?.worst?.ok : data?.best?.ok)
                  ? "Ver procedimiento general (mejor caso)"
                  : "Ejecuta el análisis para ver el procedimiento"
              }
            >
              <span className="material-symbols-outlined text-sm">
                visibility
              </span>
              <span>Ver Procedimiento</span>
            </button>
          </div>
        </div>
        <div className="glass-card p-4 rounded-lg text-center shadow-[0_8px_32px_0_rgba(234,179,8,0.3)] hover:shadow-[0_12px_40px_0_rgba(234,179,8,0.4)] relative">
          {data?.avg && typeof data.avg !== "string" && data.avg.totals?.avg_model_info && (
            <div className="absolute top-2 right-2 group">
              <button
                className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30 flex items-center justify-center text-xs font-semibold transition-colors"
                title={data.avg.totals.avg_model_info.note}
              >
                ?
              </button>
              <div className="absolute right-0 top-6 w-48 p-2 bg-slate-800 border border-yellow-500/30 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-xs text-left">
                <div className="text-yellow-300 font-semibold mb-1">
                  Modelo:
                </div>
                <div className="text-slate-300">
                  {data.avg.totals.avg_model_info.note}
                </div>
              </div>
            </div>
          )}
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
              <div className="scale-110">
                <Formula
                  latex={
                    getBestAsymptoticNotation(
                      "average",
                      data?.avg === "same_as_worst" 
                        ? data?.worst?.totals || {} 
                        : data?.avg?.totals || {},
                    ).notation
                  }
                />
              </div>
            </div>
            <h3 className="font-semibold text-yellow-300 mb-1">
              Caso promedio
            </h3>
            <button
              onClick={() => onViewGeneralProcedure("average")}
              disabled={!(data?.avg === "same_as_worst" ? data?.worst?.ok : data?.avg?.ok)}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-colors ${
                (data?.avg === "same_as_worst" ? data?.worst?.ok : data?.avg?.ok)
                  ? "text-white glass-secondary hover:bg-sky-500/20"
                  : "text-slate-400 border border-white/10 bg-white/5 cursor-not-allowed opacity-60"
              }`}
              title={
                (data?.avg === "same_as_worst" ? data?.worst?.ok : data?.avg?.ok)
                  ? "Ver procedimiento general (caso promedio)"
                  : "Ejecuta el análisis para ver el procedimiento"
              }
            >
              <span className="material-symbols-outlined text-sm">
                visibility
              </span>
              <span>Ver Procedimiento</span>
            </button>
          </div>
        </div>
        <div className="glass-card p-4 rounded-lg text-center shadow-[0_8px_32px_0_rgba(239,68,68,0.3)] hover:shadow-[0_12px_40px_0_rgba(239,68,68,0.4)]">
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <div className="scale-110">
                <Formula
                  latex={
                    getBestAsymptoticNotation(
                      "worst",
                      data?.worst?.totals || {},
                    ).notation
                  }
                />
              </div>
            </div>
            <h3 className="font-semibold text-red-300 mb-1">Peor caso</h3>
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
                        ? "Solo se conoce esta cota"
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
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-colors ${
                data?.worst?.ok
                  ? "text-white glass-secondary hover:bg-sky-500/20"
                  : "text-slate-400 border border-white/10 bg-white/5 cursor-not-allowed opacity-60"
              }`}
              title={
                data?.worst?.ok
                  ? "Ver procedimiento general (peor caso)"
                  : "Ejecuta el análisis para ver el procedimiento"
              }
            >
              <span className="material-symbols-outlined text-sm">
                visibility
              </span>
              <span>Ver Procedimiento</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
