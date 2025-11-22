"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import React from "react";

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
    
    return rounded.toFixed(3).replace(/\.?0+$/, '');
  });
}

interface IterationProcedureModalProps {
  open: boolean;
  onClose: () => void;
  data: AnalyzeOpenResponse | null | undefined;
  recurrence: {
    form: string;
    a: number;
    b: number;
    f: string;
    n0: number;
    applicable: boolean;
    notes: string[];
    method?: "master" | "iteration";
  } | null | undefined;
  iteration: {
    method: "iteration";
    g_function: string;
    expansions: string[];
    general_form: string;
    base_case: {
      condition: string;
      k: string;
    };
    summation: {
      expression: string;
      evaluated: string;
    };
    theta: string;
  } | null | undefined;
  proof: Array<{
    id: string;
    text: string;
  }> | null | undefined;
  theta: string | null | undefined;
}

export default function IterationProcedureModal({
  open,
  onClose,
  data: _data,
  recurrence,
  iteration,
  proof,
  theta,
}: Readonly<IterationProcedureModalProps>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="Cerrar modal"
      />
      <div className="absolute left-1/2 top-1/2 w-[min(95vw,1400px)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">Procedimiento Completo - Método de Iteración</h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Columna izquierda: Ecuación de Recurrencia y Expansiones */}
            <div className="space-y-6 lg:col-span-3">
              {/* Ecuación de Recurrencia */}
              {recurrence && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold mb-3">Ecuación de Recurrencia</h4>
                  <div className="bg-slate-900/50 p-4 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <Formula latex={recurrence.form} display />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1 mt-3">
                    <Formula latex={`a = ${recurrence.a}`} />
                    <span className="text-slate-300">,</span>
                    <Formula latex={`f(n) = ${recurrence.f}`} />
                    <span className="text-slate-300">,</span>
                    <Formula latex={`n_0 = ${recurrence.n0}`} />
                  </div>
                </div>
              )}

              {/* Detección Automática */}
              {iteration && (
                <div className="p-4 rounded-lg bg-purple-800/20 border border-purple-500/20">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-400">check_circle</span>
                    <span>Detección Automática</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-slate-300">Un solo llamado recursivo (a = 1)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-slate-300">Subproblema decrease-and-conquer: <Formula latex={iteration.g_function} /></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-slate-300">No divide-and-conquer (no múltiples subproblemas)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-slate-300">Subproblema estrictamente más pequeño</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Expansiones Simbólicas */}
              {iteration && iteration.expansions && iteration.expansions.length > 0 && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold mb-4">Expansiones Simbólicas</h4>
                  <div className="space-y-3">
                    {iteration.expansions.map((expansion, idx) => (
                      <div key={idx} className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto">
                        <div className="flex items-start gap-2">
                          <span className="text-purple-400 font-semibold text-xs mt-1">{idx + 1}.</span>
                          <div className="flex-1 overflow-x-auto">
                            <Formula latex={expansion} display />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forma General */}
              {iteration && iteration.general_form && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold mb-3">Forma General</h4>
                  <div className="bg-slate-900/50 p-4 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <Formula latex={iteration.general_form} display />
                  </div>
                </div>
              )}

              {/* Caso Base */}
              {iteration && iteration.base_case && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold mb-3">Determinación del Caso Base</h4>
                  <div className="space-y-2">
                    <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto">
                      <div className="text-sm text-slate-300 mb-2">Condición:</div>
                      <div className="flex justify-center">
                        <Formula latex={iteration.base_case.condition} display />
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto">
                      <div className="text-sm text-slate-300 mb-2">Resolviendo para k:</div>
                      <div className="flex justify-center">
                        <Formula latex={`k = ${iteration.base_case.k}`} display />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Evaluación de Sumatoria */}
              {iteration && iteration.summation && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold mb-3">Evaluación de la Sumatoria</h4>
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto">
                      <div className="text-sm text-slate-300 mb-2">Sustitución:</div>
                      <div className="flex justify-center">
                        <Formula latex={iteration.summation.expression} display />
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto">
                      <div className="text-sm text-slate-300 mb-2">Resultado:</div>
                      <div className="flex justify-center">
                        <Formula latex={iteration.summation.evaluated} display />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultado Final */}
              {iteration && iteration.theta && (
                <div className="p-4 rounded-lg bg-purple-800/20 border border-purple-500/20">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-400">workspace_premium</span>
                    <span>Resultado Final</span>
                  </h4>
                  <div className="bg-slate-900/50 p-4 rounded border border-purple-500/20 overflow-x-auto">
                    <div className="flex justify-center">
                      <Formula latex={`T(n) = ${roundLatexNumbers(iteration.theta)}`} display />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha: Pasos del Procedimiento */}
            <div className="lg:col-span-2">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10 sticky top-0">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-400">list</span>
                  <span>Pasos del Método</span>
                </h4>
                <div className="space-y-2 max-h-[calc(90vh-12rem)] overflow-y-auto scrollbar-custom">
                  {proof && proof.length > 0 ? (
                    proof.map((step, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg text-sm overflow-x-auto ${
                          step.id === "iteration_start" || step.id === "method"
                            ? "bg-purple-900/20 border border-purple-500/30"
                            : step.id === "step1" || step.id === "step2" || step.id === "step2b"
                            ? "bg-blue-900/20 border border-blue-500/20"
                            : step.id === "step3" || step.id === "step4"
                            ? "bg-indigo-900/20 border border-indigo-500/20"
                            : step.id === "step5" || step.id === "step6"
                            ? "bg-violet-900/20 border border-violet-500/20"
                            : step.id === "step7"
                            ? "bg-purple-900/30 border border-purple-500/40"
                            : "bg-slate-900/50 border border-white/10"
                        }`}
                      >
                        <Formula latex={step.text} />
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">No hay pasos disponibles</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

