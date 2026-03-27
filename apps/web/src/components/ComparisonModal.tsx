"use client";

import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { getBestAsymptoticNotation } from "@/lib/asymptotic-notation";
import { translateBackendContent } from "@/lib/backend-content-translator";
import type { CoreAnalysisData } from "@/lib/extract-core-data";

import Formula from "./Formula";
import BaseModalContainer from "./modals/BaseModalContainer";

interface ComparisonModalProps {
  open: boolean;
  onClose: () => void;
  ownData: {
    worst: CoreAnalysisData | null;
    best: CoreAnalysisData | "same_as_worst" | null;
    avg: CoreAnalysisData | "same_as_worst" | null;
  };
  llmData: {
    worst: CoreAnalysisData | null;
    best: CoreAnalysisData | "same_as_worst" | null;
    avg: CoreAnalysisData | "same_as_worst" | null;
  };
  note: string;
  isRecursive: boolean;
}

/**
 * Extrae el icono y el color de la nota del LLM basándose en el emoji.
 */
function parseNote(note: string): {
  icon: string;
  text: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  // Extraer el primer carácter o par de caracteres (para emojis que usan surrogate pairs)
  let emoji = "😐";
  let text = note.trim();

  if (text.length > 0) {
    const firstChar = text[0];
    const firstTwoChars = text.substring(0, 2);

    // Verificar si es un surrogate pair (emoji de 2 caracteres)
    if (firstTwoChars.length === 2) {
      const code1 = firstTwoChars.charCodeAt(0);
      const code2 = firstTwoChars.charCodeAt(1);
      // Los surrogate pairs tienen códigos en estos rangos
      if (
        code1 >= 0xd800 &&
        code1 <= 0xdbff &&
        code2 >= 0xdc00 &&
        code2 <= 0xdfff
      ) {
        emoji = firstTwoChars;
        text = text.substring(2).trim();
      } else if (firstChar.charCodeAt(0) > 127) {
        // Carácter Unicode simple (no ASCII)
        emoji = firstChar;
        text = text.substring(1).trim();
      }
    } else if (firstChar.charCodeAt(0) > 127) {
      // Carácter Unicode simple
      emoji = firstChar;
      text = text.substring(1).trim();
    }
  }

  // Determinar icono y color basado en el emoji
  let icon = "sentiment_neutral";
  let color = "text-slate-300";
  let bgColor = "bg-slate-500/10";
  let borderColor = "border-slate-500/30";

  const emojiStr = emoji;
  if (
    emojiStr.includes("😊") ||
    emojiStr.includes("😄") ||
    emojiStr.includes("😃") ||
    emojiStr.includes("✨") ||
    emojiStr.includes("👍")
  ) {
    icon = "sentiment_very_satisfied";
    color = "text-green-300";
    bgColor = "bg-green-500/10";
    borderColor = "border-green-500/30";
  } else if (
    emojiStr.includes("😐") ||
    emojiStr.includes("😑") ||
    emojiStr.includes("😶") ||
    emojiStr.includes("🤔")
  ) {
    icon = "sentiment_neutral";
    color = "text-yellow-300";
    bgColor = "bg-yellow-500/10";
    borderColor = "border-yellow-500/30";
  } else if (
    emojiStr.includes("😕") ||
    emojiStr.includes("😞") ||
    emojiStr.includes("😟") ||
    emojiStr.includes("😔")
  ) {
    icon = "sentiment_dissatisfied";
    color = "text-orange-300";
    bgColor = "bg-orange-500/10";
    borderColor = "border-orange-500/30";
  }

  return { icon, text, color, bgColor, borderColor };
}

type ComparisonT = {
  cases: (k: string) => string;
  view: (k: string, values?: Record<string, string | number>) => string;
};

/**
 * Renderiza los datos core de un análisis iterativo para un caso específico.
 */
function renderIterativeCaseData(
  data: CoreAnalysisData | "same_as_worst" | null,
  caseType: "worst" | "best" | "average",
  _isOwn: boolean,
  worstData: CoreAnalysisData | null | undefined,
  t: ComparisonT,
) {
  // Resolver data: si es "same_as_worst", usar worstData
  const resolvedData = data === "same_as_worst" ? worstData : data;

  if (!resolvedData) {
    return (
      <div className="text-center text-slate-400 py-4">
        <span className="material-symbols-outlined text-2xl mb-1 block">
          hourglass_empty
        </span>
        <p className="text-xs">{t.view("noDataAvailable")}</p>
      </div>
    );
  }

  const caseLabel =
    caseType === "worst"
      ? t.cases("worst")
      : caseType === "best"
        ? t.cases("best")
        : t.cases("average");
  const caseColor =
    caseType === "worst" ? "red" : caseType === "best" ? "green" : "yellow";

  // Obtener la cota adecuada según el caso
  const totals = {
    big_theta: resolvedData.big_theta,
    big_o: resolvedData.big_o,
    big_omega: resolvedData.big_omega,
  };
  const notation = getBestAsymptoticNotation(caseType, totals);

  return (
    <div className="space-y-2 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h4 className={`text-sm font-semibold text-${caseColor}-300`}>
          {caseLabel}
        </h4>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
            caseType === "worst"
              ? "bg-red-500/20 text-red-300 border-red-500/30"
              : caseType === "best"
                ? "bg-green-500/20 text-green-300 border-green-500/30"
                : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
          }`}
        >
          {caseLabel}
        </span>
      </div>

      <div className="flex-1 flex flex-col space-y-2 min-h-0">
        {resolvedData.T_polynomial && (
          <div className="glass-card p-2 rounded-lg flex-shrink-0">
            <div className="text-xs text-slate-400 mb-1">
              {t.view("tPolynomial")}
            </div>
            <div className="text-white overflow-x-auto scrollbar-custom">
              <Formula latex={resolvedData.T_polynomial} display />
            </div>
          </div>
        )}

        {resolvedData.T_open && (
          <div className="glass-card p-2 rounded-lg flex-shrink-0">
            <div className="text-xs text-slate-400 mb-1">{t.view("tOpen")}</div>
            <div className="text-white overflow-x-auto scrollbar-custom">
              <Formula latex={resolvedData.T_open} display />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 flex-shrink-0">
          {resolvedData.big_o && (
            <div className="glass-card p-2 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 mb-1">
                {t.view("bigO")}
              </div>
              <div className="text-white font-semibold text-xs overflow-x-auto scrollbar-custom">
                <Formula latex={resolvedData.big_o} />
              </div>
            </div>
          )}
          {resolvedData.big_omega && (
            <div className="glass-card p-2 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 mb-1">
                {t.view("bigOmega")}
              </div>
              <div className="text-white font-semibold text-xs overflow-x-auto scrollbar-custom">
                <Formula latex={resolvedData.big_omega} />
              </div>
            </div>
          )}
          {resolvedData.big_theta && (
            <div className="glass-card p-2 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 mb-1">
                {t.view("bigTheta")}
              </div>
              <div className="text-white font-semibold text-xs overflow-x-auto scrollbar-custom">
                <Formula latex={resolvedData.big_theta} />
              </div>
            </div>
          )}
        </div>

        {/* Mostrar la cota adecuada según el caso - solo si hay datos */}
        {notation.notation && !notation.notation.includes("—") && (
          <div
            className={`glass-card p-2 rounded-lg text-center border flex-shrink-0 ${
              caseType === "worst"
                ? "border-red-500/30"
                : caseType === "best"
                  ? "border-green-500/30"
                  : "border-yellow-500/30"
            }`}
          >
            <div className="text-[10px] text-slate-400 mb-1">
              {caseType === "worst"
                ? t.view("boundUpper")
                : caseType === "best"
                  ? t.view("boundLower")
                  : t.view("boundAvg")}
            </div>
            <div
              className={`text-${caseColor}-300 font-semibold text-sm overflow-x-auto scrollbar-custom`}
            >
              <Formula latex={notation.notation} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renderiza los datos core de un análisis iterativo con todos los casos.
 */
function renderIterativeData(
  ownData: {
    worst: CoreAnalysisData | null;
    best: CoreAnalysisData | "same_as_worst" | null;
    avg: CoreAnalysisData | "same_as_worst" | null;
  },
  llmData: {
    worst: CoreAnalysisData | null;
    best: CoreAnalysisData | "same_as_worst" | null;
    avg: CoreAnalysisData | "same_as_worst" | null;
  },
  isOwn: boolean,
  t: ComparisonT,
) {
  const cardColor = isOwn
    ? "bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30"
    : "bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30";
  const titleColor = isOwn ? "text-blue-400" : "text-purple-400";
  const label = isOwn ? t.view("ownAnalysis") : t.view("llmAnalysis");

  return (
    <div
      className={`glass-card p-4 rounded-lg border ${cardColor} h-full flex flex-col`}
    >
      <h3
        className={`text-lg font-semibold mb-4 flex items-center gap-2 ${titleColor}`}
      >
        <span className={`material-symbols-outlined ${titleColor}`}>
          functions
        </span>
        {label}
      </h3>

      <div className="space-y-4 flex-1 flex flex-col">
        <div className="glass-card p-3 rounded-lg bg-red-500/5 border border-red-500/20 flex-1 flex flex-col min-h-0">
          {renderIterativeCaseData(
            isOwn ? ownData.worst : llmData.worst,
            "worst",
            isOwn,
            isOwn ? ownData.worst : llmData.worst,
            t,
          )}
        </div>

        <div className="glass-card p-3 rounded-lg bg-green-500/5 border border-green-500/20 flex-1 flex flex-col min-h-0">
          {renderIterativeCaseData(
            isOwn ? ownData.best : llmData.best,
            "best",
            isOwn,
            isOwn ? ownData.worst : llmData.worst,
            t,
          )}
        </div>

        <div className="glass-card p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 flex-1 flex flex-col min-h-0">
          {renderIterativeCaseData(
            isOwn ? ownData.avg : llmData.avg,
            "average",
            isOwn,
            isOwn ? ownData.worst : llmData.worst,
            t,
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Renderiza los datos core de un análisis recursivo.
 */
function renderRecursiveData(
  worstData: CoreAnalysisData | null,
  bestData: CoreAnalysisData | "same_as_worst" | null,
  avgData: CoreAnalysisData | "same_as_worst" | null,
  label: string,
  isOwn: boolean,
  t: ComparisonT,
  locale: "es" | "en",
) {
  // Resolver "same_as_worst" a worstData
  const resolvedBest = bestData === "same_as_worst" ? worstData : bestData;
  const resolvedAvg = avgData === "same_as_worst" ? worstData : avgData;

  // Usar worst como fallback si no hay datos específicos
  const data = worstData || resolvedBest || resolvedAvg || null;
  const cardColor = isOwn
    ? "bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30"
    : "bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30";
  const titleColor = isOwn ? "text-orange-400" : "text-purple-400";

  if (!data) {
    return (
      <div
        className={`glass-card p-4 rounded-lg border ${cardColor} h-full flex flex-col`}
      >
        <h3
          className={`text-lg font-semibold mb-4 flex items-center gap-2 ${titleColor}`}
        >
          <span className={`material-symbols-outlined ${titleColor}`}>
            account_tree
          </span>
          {label}
        </h3>
        <div className="flex-1 flex items-center justify-center text-center text-slate-400 py-8">
          <div>
            <span className="material-symbols-outlined text-4xl mb-2 block">
              hourglass_empty
            </span>
            <p>{t.view("noDataAvailable")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass-card p-4 rounded-lg border ${cardColor} h-full flex flex-col`}
    >
      <h3
        className={`text-lg font-semibold mb-4 flex items-center gap-2 ${titleColor}`}
      >
        <span className={`material-symbols-outlined ${titleColor}`}>
          account_tree
        </span>
        {label}
      </h3>

      <div className="space-y-4 flex-1 flex flex-col">
        {data.recurrence && (
          <div className="glass-card p-3 rounded-lg flex-shrink-0">
            <div className="text-sm text-slate-300 mb-1">
              {t.view("recurrenceLabel")}
            </div>
            <div className="text-white overflow-x-auto scrollbar-custom">
              <Formula latex={data.recurrence.form} display />
            </div>
            {data.recurrence.type === "divide_conquer" && (
              <div className="mt-2 text-xs text-slate-400">
                a = {data.recurrence.a}, b = {data.recurrence.b}, f(n) ={" "}
                <span className="overflow-x-auto scrollbar-custom inline-block">
                  <Formula latex={data.recurrence.f || ""} />
                </span>
              </div>
            )}
            {data.recurrence.type === "linear_shift" && (
              <div className="mt-2 text-xs text-slate-400">
                {t.view("order")}: {data.recurrence.order}, {t.view("shifts")} [
                {data.recurrence.shifts?.join(", ")}]
              </div>
            )}
          </div>
        )}

        {data.method && (
          <div className="glass-card p-3 rounded-lg flex-shrink-0">
            <div className="text-sm text-slate-300 mb-1">
              {t.view("methodUsed")}
            </div>
            <div className="text-white font-semibold capitalize">
              {data.method.replace("_", " ")}
            </div>
          </div>
        )}

        {data.characteristic_equation && (
          <div className="space-y-3 flex-1 flex flex-col">
            {/* Ecuación Característica */}
            <div className="glass-card p-3 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-sm text-slate-400">
                  calculate
                </span>
                <div className="text-sm font-semibold text-slate-300">
                  {t.view("characteristicEquation")}
                </div>
              </div>
              <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                <div className="scale-90">
                  <Formula
                    latex={data.characteristic_equation.equation}
                    display
                  />
                </div>
              </div>
            </div>

            {/* Raíces como badges */}
            {data.characteristic_equation.roots &&
              data.characteristic_equation.roots.length > 0 && (
                <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-sm text-slate-400">
                      functions
                    </span>
                    <div className="text-sm font-semibold text-slate-300">
                      {t.view("roots")}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.characteristic_equation.roots.map((root, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-500/30 text-xs"
                      >
                        <span className="text-blue-300 font-semibold">
                          r{idx + 1} =
                        </span>
                        <div className="scale-90 origin-center">
                          <Formula latex={root.root} />
                        </div>
                        {root.multiplicity > 1 && (
                          <span className="text-blue-400/70 text-[10px]">
                            (×{root.multiplicity})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Solución Homogénea */}
            {data.characteristic_equation.homogeneous_solution && (
              <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    integration_instructions
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    {t.view("homogeneousSolution")}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                  <div className="scale-90">
                    <Formula
                      latex={data.characteristic_equation.homogeneous_solution}
                      display
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Solución Particular */}
            {data.characteristic_equation.particular_solution && (
              <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    add_circle
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    {t.view("particularSolution")}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                  <div className="scale-90">
                    <Formula
                      latex={data.characteristic_equation.particular_solution}
                      display
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Solución General */}
            {data.characteristic_equation.general_solution && (
              <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    functions
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    {t.view("generalSolution")}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                  <div className="scale-90">
                    <Formula
                      latex={data.characteristic_equation.general_solution}
                      display
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Forma Cerrada */}
            {data.characteristic_equation.closed_form && (
              <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    code
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    {t.view("closedForm")}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                  <div className="scale-90">
                    <Formula
                      latex={data.characteristic_equation.closed_form}
                      display
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Theta Final - Mostrar los 3 casos si hay variabilidad */}
            {(() => {
              // Obtener theta de cada caso (puede venir de characteristic_equation o de T_open si no hay recurrencia calculada)
              const worstTheta =
                worstData?.characteristic_equation?.theta || worstData?.T_open;
              const bestTheta =
                resolvedBest?.characteristic_equation?.theta ||
                resolvedBest?.T_open;
              const avgTheta =
                resolvedAvg?.characteristic_equation?.theta ||
                resolvedAvg?.T_open;

              // Verificar si hay variabilidad (diferentes valores de theta)
              // También considerar cuando best case es O(1) y los otros son diferentes
              const hasVariability =
                (worstTheta &&
                  bestTheta &&
                  avgTheta &&
                  (worstTheta !== bestTheta ||
                    worstTheta !== avgTheta ||
                    bestTheta !== avgTheta)) ||
                (bestTheta && worstTheta && bestTheta !== worstTheta) ||
                (bestTheta && avgTheta && bestTheta !== avgTheta);

              if (hasVariability) {
                // Mostrar los 3 casos en la misma línea
                return (
                  <div className="glass-card p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm text-purple-400">
                        speed
                      </span>
                      <div className="text-sm font-semibold text-purple-300">
                        Θ:
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20 overflow-x-auto scrollbar-custom">
                      <div className="flex flex-row gap-4 items-center justify-center flex-wrap">
                        {bestTheta && (
                          <div className="text-center">
                            <div className="text-xs text-green-300 mb-1">
                              {t.cases("best")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={bestTheta} display />
                            </div>
                          </div>
                        )}
                        {avgTheta && (
                          <div className="text-center">
                            <div className="text-xs text-yellow-300 mb-1">
                              {t.cases("average")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={avgTheta} display />
                            </div>
                          </div>
                        )}
                        {worstTheta && (
                          <div className="text-center">
                            <div className="text-xs text-red-300 mb-1">
                              {t.cases("worst")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={worstTheta} display />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else if (data.characteristic_equation.theta) {
                // Sin variabilidad completa, pero verificar si best case es diferente
                const bestTheta =
                  resolvedBest?.characteristic_equation?.theta ||
                  resolvedBest?.T_open;
                const worstTheta =
                  worstData?.characteristic_equation?.theta ||
                  worstData?.T_open;

                // Si best case es diferente, mostrarlo también
                if (bestTheta && worstTheta && bestTheta !== worstTheta) {
                  return (
                    <div className="glass-card p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-sm text-purple-400">
                          speed
                        </span>
                        <div className="text-sm font-semibold text-purple-300">
                          Θ:
                        </div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20 overflow-x-auto scrollbar-custom">
                        <div className="flex flex-row gap-4 items-center justify-center flex-wrap">
                          {bestTheta && (
                            <div className="text-center">
                              <div className="text-xs text-green-300 mb-1">
                                {t.cases("best")}:
                              </div>
                              <div className="scale-90">
                                <Formula latex={bestTheta} display />
                              </div>
                            </div>
                          )}
                          {worstTheta && (
                            <div className="text-center">
                              <div className="text-xs text-red-300 mb-1">
                                {t.cases("worst")}:
                              </div>
                              <div className="scale-90">
                                <Formula latex={worstTheta} display />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Sin variabilidad, mostrar solo uno
                return (
                  <div className="glass-card p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm text-purple-400">
                        speed
                      </span>
                      <div className="text-sm font-semibold text-purple-300">
                        Θ:
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20 overflow-x-auto scrollbar-custom flex justify-center">
                      <div className="scale-90">
                        <Formula
                          latex={data.characteristic_equation.theta}
                          display
                        />
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {data.master && (
          <div className="space-y-3 flex-1 flex flex-col">
            {/* Encabezado del Teorema Maestro */}
            <div className="glass-card p-3 rounded-lg border border-orange-500/30 bg-orange-500/10 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-sm text-orange-400">
                  calculate
                </span>
                <div className="text-sm font-semibold text-orange-300">
                  {t.view("masterTheorem")}
                </div>
                {data.master.case && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-orange-500/30 text-orange-200 border border-orange-500/50">
                    {t.view("caseNumber", { number: data.master.case })}
                  </span>
                )}
              </div>
            </div>

            {/* Parámetros de la recurrencia */}
            {data.recurrence && data.recurrence.type === "divide_conquer" && (
              <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    settings
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    {t.view("parameters")}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-900/50 p-2 rounded border border-white/10 text-center">
                    <div className="text-[10px] text-slate-400 mb-1">a</div>
                    <div className="text-white font-semibold text-sm">
                      {data.recurrence.a}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-white/10 text-center">
                    <div className="text-[10px] text-slate-400 mb-1">b</div>
                    <div className="text-white font-semibold text-sm">
                      {data.recurrence.b}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-white/10 text-center col-span-3">
                    <div className="text-[10px] text-slate-400 mb-1">f(n)</div>
                    <div className="text-white overflow-x-auto scrollbar-custom">
                      <Formula latex={data.recurrence.f || ""} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cálculo de n^(log_b a) */}
            {data.master.nlogba && (
              <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    functions
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    {t.view("gnCalculation")}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                  <div className="scale-90">
                    <Formula latex={data.master.nlogba} display />
                  </div>
                </div>
              </div>
            )}

            {/* Comparación f(n) vs g(n) */}
            {data.master.comparison &&
              data.master.nlogba &&
              data.recurrence && (
                <div className="glass-card p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-sm text-blue-400">
                      compare_arrows
                    </span>
                    <div className="text-sm font-semibold text-blue-300">
                      {t.view("comparison")}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-blue-500/20 overflow-x-auto scrollbar-custom">
                    <div className="flex flex-col gap-2 items-center">
                      <div className="text-center">
                        <div className="text-xs text-slate-400 mb-1">f(n)</div>
                        <div className="scale-90">
                          <Formula latex={data.recurrence.f || ""} display />
                        </div>
                      </div>
                      <div className="text-blue-400 text-lg font-bold">
                        {data.master.comparison === "smaller" && " < "}
                        {data.master.comparison === "equal" && " = "}
                        {data.master.comparison === "larger" && " > "}
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-400 mb-1">
                          g(n) = n
                          <sup>
                            log<sub>b</sub> a
                          </sup>
                        </div>
                        <div className="scale-90">
                          <Formula latex={data.master.nlogba} display />
                        </div>
                      </div>
                    </div>
                  </div>
                  {data.master.case && (
                    <div className="mt-2 text-xs text-blue-300 text-center">
                      {data.master.case === 1 && t.view("case1Desc")}
                      {data.master.case === 2 && t.view("case2Desc")}
                      {data.master.case === 3 && t.view("case3Desc")}
                    </div>
                  )}
                </div>
              )}

            {/* Condición de regularidad (solo para Caso 3) */}
            {data.master.case === 3 && data.master.regularity && (
              <div className="glass-card p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-yellow-400">
                    verified
                  </span>
                  <div className="text-sm font-semibold text-yellow-300">
                    {t.view("regularityCondition")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {data.master.regularity.checked ? (
                    <span className="material-symbols-outlined text-green-400 text-sm">
                      check_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-yellow-400 text-sm">
                      warning
                    </span>
                  )}
                  <div className="text-xs text-yellow-200 flex-1">
                    {data.master.regularity.note ||
                      (data.master.regularity.checked
                        ? t.view("regularityVerified")
                        : t.view("regularityAssumed"))}
                  </div>
                </div>
              </div>
            )}

            {/* Theta Final - Mostrar los 3 casos si hay variabilidad */}
            {(() => {
              // Obtener theta de cada caso
              const worstTheta = worstData?.master?.theta || worstData?.T_open;
              const bestTheta =
                resolvedBest?.master?.theta || resolvedBest?.T_open;
              const avgTheta =
                resolvedAvg?.master?.theta || resolvedAvg?.T_open;

              // Verificar si hay variabilidad (diferentes valores de theta)
              const hasVariability =
                (worstTheta &&
                  bestTheta &&
                  avgTheta &&
                  (worstTheta !== bestTheta ||
                    worstTheta !== avgTheta ||
                    bestTheta !== avgTheta)) ||
                (bestTheta && worstTheta && bestTheta !== worstTheta) ||
                (bestTheta && avgTheta && bestTheta !== avgTheta);

              if (hasVariability) {
                // Mostrar los 3 casos en la misma línea
                return (
                  <div className="glass-card p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm text-purple-400">
                        speed
                      </span>
                      <div className="text-sm font-semibold text-purple-300">
                        {t.view("thetaFinalResult")}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20 overflow-x-auto scrollbar-custom">
                      <div className="flex flex-row gap-4 items-center justify-center flex-wrap">
                        {bestTheta && (
                          <div className="text-center">
                            <div className="text-xs text-green-300 mb-1">
                              {t.cases("best")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={bestTheta} display />
                            </div>
                          </div>
                        )}
                        {avgTheta && (
                          <div className="text-center">
                            <div className="text-xs text-yellow-300 mb-1">
                              {t.cases("average")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={avgTheta} display />
                            </div>
                          </div>
                        )}
                        {worstTheta && (
                          <div className="text-center">
                            <div className="text-xs text-red-300 mb-1">
                              {t.cases("worst")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={worstTheta} display />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else if (data.master.theta) {
                // Sin variabilidad, mostrar solo uno
                return (
                  <div className="glass-card p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm text-purple-400">
                        speed
                      </span>
                      <div className="text-sm font-semibold text-purple-300">
                        {t.view("thetaFinalResult")}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20 overflow-x-auto scrollbar-custom flex justify-center">
                      <div className="scale-90">
                        <Formula latex={data.master.theta} display />
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {data.iteration && (
          <div className="space-y-3 flex-1 flex flex-col">
            {/* Función g(n) */}
            {data.iteration.g_function && (
              <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    functions
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    {t.view("gFunction")}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                  <div className="scale-90">
                    <Formula latex={data.iteration.g_function} display />
                  </div>
                </div>
              </div>
            )}

            {/* Expansiones */}
            {data.iteration.expansions &&
              data.iteration.expansions.length > 0 && (
                <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-sm text-slate-400">
                      unfold_more
                    </span>
                    <div className="text-sm font-semibold text-slate-300">
                      {t.view("expansions")}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {data.iteration.expansions.map(
                      (expansion: string, idx: number) => (
                        <div
                          key={idx}
                          className="bg-slate-900/50 p-2 rounded border border-white/10 overflow-x-auto scrollbar-custom"
                        >
                          <div className="scale-90">
                            <Formula latex={expansion} display />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Forma General */}
            {data.iteration.general_form && (
              <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    code
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    {t.view("generalForm")}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                  <div className="scale-90">
                    <Formula latex={data.iteration.general_form} display />
                  </div>
                </div>
              </div>
            )}

            {/* Sumatoria */}
            {data.iteration.summation && (
              <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    functions
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    {t.view("summation")}
                  </div>
                </div>
                {data.iteration.summation.expression && (
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center mb-2">
                    <div className="scale-90">
                      <Formula
                        latex={translateBackendContent(
                          data.iteration.summation.expression,
                          locale,
                        )}
                        display
                      />
                    </div>
                  </div>
                )}
                {data.iteration.summation.evaluated && (
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                    <div className="scale-90">
                      <Formula
                        latex={translateBackendContent(
                          data.iteration.summation.evaluated,
                          locale,
                        )}
                        display
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theta Final - Mostrar los 3 casos si hay variabilidad */}
            {(() => {
              const worstTheta =
                worstData?.iteration?.theta || worstData?.T_open;
              const bestTheta =
                resolvedBest?.iteration?.theta || resolvedBest?.T_open;
              const avgTheta =
                resolvedAvg?.iteration?.theta || resolvedAvg?.T_open;

              // Verificar si hay variabilidad (diferentes valores de theta)
              const hasVariability =
                (worstTheta &&
                  bestTheta &&
                  avgTheta &&
                  (worstTheta !== bestTheta ||
                    worstTheta !== avgTheta ||
                    bestTheta !== avgTheta)) ||
                (bestTheta && worstTheta && bestTheta !== worstTheta) ||
                (bestTheta && avgTheta && bestTheta !== avgTheta);

              if (hasVariability) {
                // Mostrar los 3 casos en la misma línea
                return (
                  <div className="glass-card p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm text-purple-400">
                        speed
                      </span>
                      <div className="text-sm font-semibold text-purple-300">
                        Θ:
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20 overflow-x-auto scrollbar-custom">
                      <div className="flex flex-row gap-4 items-center justify-center flex-wrap">
                        {bestTheta && (
                          <div className="text-center">
                            <div className="text-xs text-green-300 mb-1">
                              {t.cases("best")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={bestTheta} display />
                            </div>
                          </div>
                        )}
                        {avgTheta && (
                          <div className="text-center">
                            <div className="text-xs text-yellow-300 mb-1">
                              {t.cases("average")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={avgTheta} display />
                            </div>
                          </div>
                        )}
                        {worstTheta && (
                          <div className="text-center">
                            <div className="text-xs text-red-300 mb-1">
                              {t.cases("worst")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={worstTheta} display />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else if (data.iteration.theta) {
                // Sin variabilidad completa, pero verificar si best case es diferente
                const bestTheta =
                  resolvedBest?.iteration?.theta || resolvedBest?.T_open;
                const worstTheta =
                  worstData?.iteration?.theta || worstData?.T_open;

                // Si best case es diferente, mostrarlo también
                if (bestTheta && worstTheta && bestTheta !== worstTheta) {
                  return (
                    <div className="glass-card p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-sm text-purple-400">
                          speed
                        </span>
                        <div className="text-sm font-semibold text-purple-300">
                          Θ:
                        </div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20 overflow-x-auto scrollbar-custom">
                        <div className="flex flex-row gap-4 items-center justify-center flex-wrap">
                          {bestTheta && (
                            <div className="text-center">
                              <div className="text-xs text-green-300 mb-1">
                                {t.cases("best")}:
                              </div>
                              <div className="scale-90">
                                <Formula latex={bestTheta} display />
                              </div>
                            </div>
                          )}
                          {worstTheta && (
                            <div className="text-center">
                              <div className="text-xs text-red-300 mb-1">
                                {t.cases("worst")}:
                              </div>
                              <div className="scale-90">
                                <Formula latex={worstTheta} display />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Sin variabilidad, mostrar solo uno
                return (
                  <div className="glass-card p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm text-purple-400">
                        speed
                      </span>
                      <div className="text-sm font-semibold text-purple-300">
                        Θ:
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20 overflow-x-auto scrollbar-custom flex justify-center">
                      <div className="scale-90">
                        <Formula latex={data.iteration.theta} display />
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {data.recursion_tree && (
          <div className="space-y-3 flex-1 flex flex-col">
            {/* Encabezado del Árbol de Recursión */}
            <div className="glass-card p-3 rounded-lg border border-green-500/30 bg-green-500/10 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-sm text-green-400">
                  account_tree
                </span>
                <div className="text-sm font-semibold text-green-300">
                  {t.view("recurrenceTree")}
                </div>
              </div>
            </div>

            {/* Altura del árbol */}
            {data.recursion_tree.height && (
              <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    height
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    {t.view("treeHeight")}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                  <div className="scale-90">
                    <Formula
                      latex={`h = ${data.recursion_tree.height}`}
                      display
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sumatoria */}
            {data.recursion_tree.summation && (
              <div className="glass-card p-3 rounded-lg border border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    functions
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    {t.view("summation")}
                  </div>
                </div>
                {data.recursion_tree.summation.expression && (
                  <div className="mb-2">
                    <div className="text-xs text-slate-400 mb-1">
                      {t.view("expression")}
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                      <div className="scale-90">
                        <Formula
                          latex={translateBackendContent(
                            data.recursion_tree.summation.expression,
                            locale,
                          )}
                          display
                        />
                      </div>
                    </div>
                  </div>
                )}
                {data.recursion_tree.summation.evaluated && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      {t.view("evaluated")}
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto scrollbar-custom flex justify-center">
                      <div className="scale-90">
                        <Formula
                          latex={translateBackendContent(
                            data.recursion_tree.summation.evaluated,
                            locale,
                          )}
                          display
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Nivel Dominante */}
            {data.recursion_tree.dominating_level && (
              <div className="glass-card p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-blue-400">
                    trending_up
                  </span>
                  <div className="text-sm font-semibold text-blue-300">
                    {t.view("dominatingLevel")}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-blue-500/20 overflow-x-auto scrollbar-custom">
                  <div className="text-xs text-blue-200">
                    {data.recursion_tree.dominating_level.level ===
                      "leaves" && (
                      <span className="font-semibold">
                        {t.view("leavesLevel")}
                      </span>
                    )}
                    {data.recursion_tree.dominating_level.level === "root" && (
                      <span className="font-semibold">
                        {t.view("rootLevel")}
                      </span>
                    )}
                    {data.recursion_tree.dominating_level.level !== "leaves" &&
                      data.recursion_tree.dominating_level.level !== "root" && (
                        <span className="font-semibold">
                          {t.view("levelN", {
                            level: data.recursion_tree.dominating_level.level,
                          })}
                        </span>
                      )}
                  </div>
                  {data.recursion_tree.dominating_level.reason && (
                    <div className="mt-2 text-xs text-blue-200/80">
                      <div className="scale-90 origin-top-left">
                        <Formula
                          latex={translateBackendContent(
                            data.recursion_tree.dominating_level.reason,
                            locale,
                          )}
                          display
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Theta Final - Mostrar los 3 casos si hay variabilidad */}
            {(() => {
              // Obtener theta de cada caso
              const worstTheta =
                worstData?.recursion_tree?.theta || worstData?.T_open;
              const bestTheta =
                resolvedBest?.recursion_tree?.theta || resolvedBest?.T_open;
              const avgTheta =
                resolvedAvg?.recursion_tree?.theta || resolvedAvg?.T_open;

              // Verificar si hay variabilidad (diferentes valores de theta)
              const hasVariability =
                (worstTheta &&
                  bestTheta &&
                  avgTheta &&
                  (worstTheta !== bestTheta ||
                    worstTheta !== avgTheta ||
                    bestTheta !== avgTheta)) ||
                (bestTheta && worstTheta && bestTheta !== worstTheta) ||
                (bestTheta && avgTheta && bestTheta !== avgTheta);

              if (hasVariability) {
                // Mostrar los 3 casos en la misma línea
                return (
                  <div className="glass-card p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm text-purple-400">
                        speed
                      </span>
                      <div className="text-sm font-semibold text-purple-300">
                        {t.view("thetaFinalResult")}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20 overflow-x-auto scrollbar-custom">
                      <div className="flex flex-row gap-4 items-center justify-center flex-wrap">
                        {bestTheta && (
                          <div className="text-center">
                            <div className="text-xs text-green-300 mb-1">
                              {t.cases("best")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={bestTheta} display />
                            </div>
                          </div>
                        )}
                        {avgTheta && (
                          <div className="text-center">
                            <div className="text-xs text-yellow-300 mb-1">
                              {t.cases("average")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={avgTheta} display />
                            </div>
                          </div>
                        )}
                        {worstTheta && (
                          <div className="text-center">
                            <div className="text-xs text-red-300 mb-1">
                              {t.cases("worst")}:
                            </div>
                            <div className="scale-90">
                              <Formula latex={worstTheta} display />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else if (data.recursion_tree.theta) {
                // Sin variabilidad, mostrar solo uno
                return (
                  <div className="glass-card p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm text-purple-400">
                        speed
                      </span>
                      <div className="text-sm font-semibold text-purple-300">
                        {t.view("thetaFinalResult")}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-purple-500/20 overflow-x-auto scrollbar-custom flex justify-center">
                      <div className="scale-90">
                        <Formula latex={data.recursion_tree.theta} display />
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {data.big_theta &&
          !data.characteristic_equation &&
          !data.master &&
          !data.iteration &&
          !data.recursion_tree && (
            <div className="glass-card p-3 rounded-lg">
              <div className="text-sm text-slate-300 mb-1">Θ:</div>
              <div className="text-white font-semibold overflow-x-auto scrollbar-custom">
                <Formula latex={data.big_theta} />
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

/**
 * Modal para comparar el análisis propio con el análisis del LLM.
 *
 * @param props - Propiedades del modal
 * @returns Componente React del modal de comparación
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
export default function ComparisonModal({
  open,
  onClose,
  ownData,
  llmData,
  note,
  isRecursive,
}: Readonly<ComparisonModalProps>) {
  const locale = useLocale() as "en" | "es";
  const tCases = useTranslations("analyzer.cases");
  const tView = useTranslations("analyzer.view");
  const tCommon = useTranslations("common");
  const t: ComparisonT = { cases: tCases, view: tView };

  if (!open) return null;

  const { icon, text, color, bgColor, borderColor } = parseNote(note);

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={tView("comparisonWithLlm")}
      titleIcon="compare_arrows"
      closeAriaLabel={tCommon("close")}
      zIndexClassName="z-[70]"
      sizeClassName="w-[90vw] max-w-7xl h-[85vh]"
      panelClassName="p-6"
      showHeader={false}
      contentClassName="p-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-400 text-xl">
            compare_arrows
          </span>
          {tView("comparisonWithLlm")}
        </h2>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          title={tCommon("close")}
          aria-label={tCommon("close")}
        >
          ✕
        </button>
      </div>

      {/* Contenido: dos columnas */}
      <div className="flex-1 grid grid-cols-2 gap-6 overflow-y-auto pr-2 scrollbar-custom items-stretch pt-2">
        {/* Columna izquierda: Análisis propio */}
        <div className="flex flex-col">
          {isRecursive
            ? renderRecursiveData(
                ownData.worst,
                ownData.best,
                ownData.avg,
                tView("ownAnalysis"),
                true,
                t,
                locale,
              )
            : renderIterativeData(ownData, llmData, true, t)}
        </div>

        {/* Columna derecha: Análisis LLM */}
        <div className="flex flex-col">
          {isRecursive
            ? renderRecursiveData(
                llmData.worst,
                llmData.best,
                llmData.avg,
                tView("llmAnalysis"),
                false,
                t,
                locale,
              )
            : renderIterativeData(ownData, llmData, false, t)}
        </div>
      </div>

      {/* Nota del LLM */}
      <div className={`mt-4 p-3 rounded-lg border ${bgColor} ${borderColor}`}>
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-lg ${color}`}>
            {icon}
          </span>
          <div className="flex-1">
            <div className={`text-xs font-semibold mb-0.5 ${color}`}>
              {tView("llmObservation")}
            </div>
            <div className={`text-xs ${color}`}>{text}</div>
          </div>
        </div>
      </div>
    </BaseModalContainer>
  );
}
