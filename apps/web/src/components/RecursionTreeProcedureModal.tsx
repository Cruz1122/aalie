"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { translateBackendContent } from "@/lib/backend-content-translator";

import Formula from "./Formula";

/**
 * Redondea los valores numéricos en una expresión LaTeX a 3 decimales.
 */
function roundLatexNumbers(latex: string): string {
  if (!latex || latex === "N/A") return latex;

  return latex.replace(/([-]?\d+\.\d+)/g, (match) => {
    const num = Number.parseFloat(match);
    if (Number.isNaN(num)) return match;

    const rounded = Math.round(num * 1000) / 1000;

    if (rounded % 1 === 0) {
      return rounded.toString();
    }

    return rounded.toFixed(3).replace(/\.?0+$/, "");
  });
}

interface RecursionTreeProcedureModalProps {
  open: boolean;
  onClose: () => void;
  data: AnalyzeOpenResponse | null | undefined;
  recurrence:
    | {
        form: string;
        a: number;
        b: number;
        f: string;
        n0: number;
        applicable: boolean;
        notes: string[];
      }
    | null
    | undefined;
  recursionTree:
    | {
        method: "recursion_tree";
        levels: Array<{
          level: number;
          num_nodes: number;
          num_nodes_latex: string;
          subproblem_size_latex: string;
          cost_per_node_latex: string;
          total_cost_latex: string;
        }>;
        height: string;
        summation: {
          expression: string;
          evaluated: string;
          theta: string;
        };
        dominating_level: {
          level: string | number;
          reason: string;
        };
        table_by_levels: Array<{
          level: number;
          num_nodes: string;
          subproblem_size: string;
          cost_per_node: string;
          total_cost: string;
        }>;
        theta: string;
      }
    | null
    | undefined;
  proof:
    | Array<{
        id: string;
        text: string;
      }>
    | null
    | undefined;
  theta: string | null | undefined;
}

export default function RecursionTreeProcedureModal({
  open,
  onClose,
  data: _data,
  recurrence,
  recursionTree,
  proof: _proof,
  theta,
}: Readonly<RecursionTreeProcedureModalProps>) {
  const t = useTranslations("analyzer.recursionTreeProcedureModal");
  const locale = useLocale() as "en" | "es";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute -top-8 -left-4 -right-4 -bottom-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label={t("closeModal")}
      />
      <div className="absolute left-1/2 top-1/2 w-[min(95vw,1600px)] max-h-[75vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-3 flex-shrink-0">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400">
              account_tree
            </span>
            <span>{t("title")}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            aria-label={t("closeModal")}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
            {/* Columna izquierda: Ecuación de Recurrencia, Tabla de Niveles y Pasos */}
            <div className="space-y-4 lg:col-span-7 flex flex-col min-h-0">
              {/* Ecuación de Recurrencia - Compacta */}
              {recurrence && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-400">
                        functions
                      </span>
                      <span>{t("recurrenceEquation")}</span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      <Formula latex={`a = ${recurrence.a}`} />
                      <span className="text-slate-400">,</span>
                      <Formula latex={`b = ${recurrence.b}`} />
                      <span className="text-slate-400">,</span>
                      <Formula latex={`f(n) = ${recurrence.f}`} />
                      <span className="text-slate-400">,</span>
                      <Formula latex={`n_0 = ${recurrence.n0}`} />
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <Formula latex={recurrence.form} display />
                  </div>
                </div>
              )}

              {/* Tabla por Niveles */}
              {recursionTree &&
                recursionTree.table_by_levels &&
                recursionTree.table_by_levels.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10 flex flex-col flex-1 min-h-0">
                    <h4 className="text-white font-semibold mb-3 text-sm flex-shrink-0 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-400">
                        table_chart
                      </span>
                      <span>{t("tableByLevels")}</span>
                    </h4>
                    <div className="overflow-auto flex-1 scrollbar-custom">
                      <table className="w-full text-xs border-collapse">
                        <thead className="sticky top-0 bg-slate-800/95 z-10">
                          <tr className="border-b border-white/20">
                            <th className="text-center p-1.5 text-slate-300 font-semibold w-12">
                              {t("levelCol")}
                            </th>
                            <th className="text-center p-1.5 text-slate-300 font-semibold">
                              {t("numNodesCol")}
                            </th>
                            <th className="text-center p-1.5 text-slate-300 font-semibold">
                              {t("sizeCol")}
                            </th>
                            <th className="text-center p-1.5 text-slate-300 font-semibold">
                              {t("costPerNodeCol")}
                            </th>
                            <th className="text-center p-1.5 text-slate-300 font-semibold">
                              {t("totalCostCol")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recursionTree.table_by_levels.map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-white/10 hover:bg-slate-700/30 transition-colors"
                            >
                              <td className="p-1.5 text-white font-medium text-center">
                                {row.level}
                              </td>
                              <td className="p-1.5 text-slate-300 text-center">
                                <Formula latex={row.num_nodes} />
                              </td>
                              <td className="p-1.5 text-slate-300 text-center">
                                <Formula latex={row.subproblem_size} />
                              </td>
                              <td className="p-1.5 text-slate-300 text-center">
                                <Formula latex={row.cost_per_node} />
                              </td>
                              <td className="p-1.5 text-slate-300 text-center">
                                <Formula latex={row.total_cost} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>

            {/* Columna derecha: Información complementaria */}
            <div className="space-y-3 lg:col-span-5">
              {/* Altura */}
              {recursionTree && recursionTree.height && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400">
                      height
                    </span>
                    <span>{t("height")}</span>
                  </h4>
                  <div className="bg-slate-900/50 p-2 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <Formula latex={`h = ${recursionTree.height}`} />
                  </div>
                </div>
              )}

              {/* Sumatoria */}
              {recursionTree && recursionTree.summation && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-400">
                      calculate
                    </span>
                    <span>{t("summation")}</span>
                  </h4>
                  <div className="bg-slate-900/50 p-2 rounded border border-white/10 overflow-x-auto">
                    <div className="text-xs text-slate-400 mb-1">
                      {t("expression")}
                    </div>
                    <div className="flex justify-center scale-90 origin-center">
                      <Formula
                        latex={translateBackendContent(
                          recursionTree.summation.expression,
                          locale,
                        )}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mb-1 mt-2">
                      {t("evaluated")}
                    </div>
                    <div className="flex justify-center scale-90 origin-center">
                      <Formula
                        latex={translateBackendContent(
                          recursionTree.summation.evaluated,
                          locale,
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Nivel Dominante */}
              {recursionTree && recursionTree.dominating_level && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400">
                      trending_up
                    </span>
                    <span>{t("dominatingLevel")}</span>
                  </h4>
                  <div className="bg-slate-900/50 p-2 rounded border border-white/10 overflow-x-auto">
                    <div className="flex justify-center scale-90 origin-center">
                      <Formula
                        latex={translateBackendContent(
                          recursionTree.dominating_level.reason,
                          locale,
                        )}
                        display
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Ecuación de eficiencia - Destacada */}
              {theta && (
                <div className="p-4 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                  <h5 className="text-cyan-300 font-semibold mb-2 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">
                      workspace_premium
                    </span>
                    <span>{t("efficiencyEquation")}</span>
                  </h5>
                  <div className="text-center">
                    <Formula
                      latex={`T(n) = ${roundLatexNumbers(theta)}`}
                      display
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
