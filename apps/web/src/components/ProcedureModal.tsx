"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import { useEffect } from "react";

import Formula from "./Formula";

// Helper para renderizar variables con KaTeX
function renderVariable(variable: string) {
  // Renderizar todo con KaTeX para consistencia visual
  return <Formula latex={variable} />
}

interface ProcedureModalProps {
  open: boolean;
  onClose: () => void;
  selectedLine?: number | null;
  analysisData?: AnalyzeOpenResponse;
}

export default function ProcedureModal({
  open,
  onClose,
  selectedLine,
  analysisData,
}: Readonly<ProcedureModalProps>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    
    if (open) {
      // Bloquear scroll de la página
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKey);
    } else {
      // Restaurar scroll de la página
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isLineProcedure = selectedLine !== null && selectedLine !== undefined;
  const modalTitle = isLineProcedure 
    ? `Procedimiento - Línea ${selectedLine}`
    : "Procedimiento Completo";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute left-1/2 top-1/2 w-[min(95vw,1200px)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">{modalTitle}</h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-custom">
          {isLineProcedure ? (
            // Contenido específico para una línea
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                <h4 className="font-semibold text-white mb-2">Análisis de Línea {selectedLine}</h4>
                <div className="space-y-3">
                  <div className="p-3 rounded bg-slate-900/50 border border-blue-500/20">
                    <span className="text-sm font-medium text-blue-300">Costo Individual</span>
                    <p className="text-slate-300 mt-1 text-sm">
                      Análisis detallado del costo computacional para esta línea específica.
                    </p>
                  </div>
                  <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20">
                    <span className="text-sm font-medium text-amber-300">Ejecuciones</span>
                    <p className="text-slate-300 mt-1 text-sm">
                      Número de veces que se ejecuta esta instrucción.
                    </p>
                  </div>
                  <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                    <span className="text-sm font-medium text-green-300">Fórmula Resultante</span>
                    <p className="text-slate-300 mt-1 text-sm">
                      Expresión matemática del costo para esta línea.
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-300 text-center py-4 border-2 border-dashed border-slate-600 rounded-lg">
                <p className="text-sm">🔍 Procedimiento específico para línea {selectedLine}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Sprint 3/4: detalles matemáticos y pasos de cálculo
                </p>
              </div>
            </div>
          ) : (
            // Contenido general (análisis completo)
            <>
              {analysisData && (
                <div className="space-y-4">
                  {/* Ecuación principal */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">Ecuación de Eficiencia</h4>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10">
                      <Formula latex={analysisData.totals.T_open} display />
                    </div>
                  </div>

                  {/* Pasos del procedimiento */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">Pasos del Procedimiento</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-custom">
                      {analysisData.totals.procedure.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-2">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 bg-slate-900/50 p-3 rounded-lg border border-white/10">
                            <Formula latex={step} display />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Símbolos */}
                  {analysisData.totals.symbols && (
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">Símbolos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-custom">
                        {Object.entries(analysisData.totals.symbols).map(([symbol, description]) => (
                          <div key={symbol} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded border border-white/10">
                            <div className="flex-shrink-0">
                              {renderVariable(symbol)}
                            </div>
                            <span className="text-slate-300 text-xs">= {description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  {analysisData.totals.notes && (
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">Notas</h4>
                      <ul className="space-y-2 max-h-32 overflow-y-auto scrollbar-custom">
                        {analysisData.totals.notes.map((note, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-amber-400 mt-1 flex-shrink-0">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}