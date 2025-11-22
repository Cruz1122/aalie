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

interface RecursiveProcedureModalProps {
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
  } | null | undefined;
  master: {
    case: 1 | 2 | 3 | null;
    nlogba: string;
    comparison: "smaller" | "equal" | "larger" | null;
    regularity: {
      checked: boolean;
      note: string;
    };
    theta: string | null;
  } | null | undefined;
  proof: Array<{
    id: string;
    text: string;
  }> | null | undefined;
  theta: string | null | undefined;
}

export default function RecursiveProcedureModal({
  open,
  onClose,
  data: _data,
  recurrence,
  master,
  proof,
  theta,
}: Readonly<RecursiveProcedureModalProps>) {
  if (!open) return null;

  // Los pasos de prueba ya vienen con el formato correcto desde el backend

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
          <h3 className="text-lg font-semibold text-white">Procedimiento Completo - Teorema Maestro</h3>
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
            {/* Columna izquierda: Ecuación de Recurrencia y Casos */}
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
                    <Formula latex={`b = ${recurrence.b}`} />
                    <span className="text-slate-300">,</span>
                    <Formula latex={`f(n) = ${recurrence.f}`} />
                    <span className="text-slate-300">,</span>
                    <Formula latex={`n_0 = ${recurrence.n0}`} />
                  </div>
                </div>
              )}

              {/* Casos del Teorema Maestro */}
              {master && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold mb-4">Casos del Teorema Maestro</h4>
                  
                  {/* Mostrar g(n) */}
                  {master.nlogba && (
                    <div className="mb-4 p-3 rounded-lg bg-slate-900/50 border border-white/10 flex items-center justify-center">
                      <div className="text-sm">
                        <Formula latex={`g(n) = n^{\\log_b a} = ${master.nlogba}`} />
                      </div>
                    </div>
                  )}

                  {/* Grid de los 3 casos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Caso 1 */}
                    <div
                      className={`p-3 rounded-lg border-2 transition-all ${
                        master.case === 1
                          ? "bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/20"
                          : "bg-slate-900/50 border-white/10 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            master.case === 1 ? "bg-green-400" : "bg-slate-500"
                          }`}
                        />
                        <h5 className="font-semibold text-white">Caso 1</h5>
                      </div>
                      <div className="text-xs text-slate-300 mb-2 flex justify-center">
                        <Formula latex="f(n) < g(n)" />
                      </div>
                      <div className="text-xs flex justify-center">
                        <Formula latex="T(n) = \Theta(g(n)) = \Theta(n^{\log_{b} a})" />
                      </div>
                    </div>

                    {/* Caso 2 */}
                    <div
                      className={`p-3 rounded-lg border-2 transition-all ${
                        master.case === 2
                          ? "bg-yellow-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/20"
                          : "bg-slate-900/50 border-white/10 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            master.case === 2 ? "bg-yellow-400" : "bg-slate-500"
                          }`}
                        />
                        <h5 className="font-semibold text-white">Caso 2</h5>
                      </div>
                      <div className="text-xs text-slate-300 mb-2 flex justify-center">
                        <Formula latex="f(n) = g(n)" />
                      </div>
                      <div className="text-xs flex justify-center">
                        <Formula latex="T(n) = \Theta(g(n) \cdot \log n) = \Theta(n^{\log_{b} a} \cdot \log n)" />
                      </div>
                    </div>

                    {/* Caso 3 */}
                    <div
                      className={`p-3 rounded-lg border-2 transition-all ${
                        master.case === 3
                          ? "bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20"
                          : "bg-slate-900/50 border-white/10 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            master.case === 3 ? "bg-red-400" : "bg-slate-500"
                          }`}
                        />
                        <h5 className="font-semibold text-white">Caso 3</h5>
                      </div>
                      <div className="text-xs text-slate-300 mb-2 flex justify-center">
                        <Formula latex="f(n) > g(n)" />
                      </div>
                      <div className="text-xs flex justify-center">
                        <Formula latex="T(n) = \Theta(f(n))" />
                      </div>
                      {master.case === 3 && master.regularity && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <p className="text-xs text-slate-400">
                            Regularidad: {master.regularity.checked ? "✓ Verificada" : "⚠ Asumida"}
                            {master.regularity.note && ` - ${master.regularity.note}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha: Pasos de Prueba */}
            <div className="space-y-6 lg:col-span-2">
              {/* Pasos de Prueba */}
              {proof && proof.length > 0 && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-400">description</span>
                    <span>Pasos de Prueba</span>
                  </h4>
                  <div className="space-y-2 max-h-[calc(90vh-435px)] overflow-y-auto scrollbar-custom w-full">                   {proof.map((step, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-900/50 border border-white/10 w-full">
                        <div className="text-sm text-slate-200 w-full overflow-x-auto">
                          <div className="w-full">
                            <Formula latex={step.text} display />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ecuación de eficiencia */}
              {theta && (
                <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30">
                  <h5 className="text-green-300 font-semibold mb-2 text-sm">Ecuación de eficiencia</h5>
                  <div className="text-lg flex justify-center">
                    <Formula latex={`T(n) = ${roundLatexNumbers(theta)}`} display />
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

