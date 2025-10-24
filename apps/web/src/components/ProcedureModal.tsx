"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import React, { useEffect, useMemo, useCallback, useState, useRef } from "react";

import Formula from "./Formula";

// Helper para renderizar variables con KaTeX (memoizado)
const RenderVariable = React.memo(({ variable }: { variable: string }) => {
  return <Formula latex={variable} />
});
RenderVariable.displayName = 'RenderVariable';

// Componente de lista virtualizada simple para pasos del procedimiento
const VirtualizedStepsList = React.memo(({ steps }: { steps: string[] }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(10, steps.length) });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 80; // Altura estimada por paso

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const containerHeight = e.currentTarget.clientHeight;
    
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(steps.length, start + Math.ceil(containerHeight / itemHeight) + 2);
    
    setVisibleRange({ start, end });
  }, [steps.length, itemHeight]);

  const visibleSteps = steps.slice(visibleRange.start, visibleRange.end);
  const totalHeight = steps.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div 
      ref={containerRef}
      className="space-y-3 max-h-96 overflow-y-auto scrollbar-custom"
      onScroll={handleScroll}
      style={{ 
        scrollBehavior: 'smooth',
        willChange: 'scroll-position'
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleSteps.map((step, index) => (
            <div key={visibleRange.start + index} className="flex items-start gap-3 p-2" style={{ height: itemHeight }}>
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                {visibleRange.start + index + 1}
              </div>
              <div className="flex-1 bg-slate-900/50 p-3 rounded-lg border border-white/10">
                <Formula latex={step} display />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
VirtualizedStepsList.displayName = 'VirtualizedStepsList';

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
  const [scrollDebounce, setScrollDebounce] = useState<NodeJS.Timeout | null>(null);

  // Memoizar el título del modal
  const modalTitle = useMemo(() => {
    const isLineProcedure = selectedLine !== null && selectedLine !== undefined;
    return isLineProcedure 
      ? `Procedimiento - Línea ${selectedLine}`
      : "Procedimiento Completo";
  }, [selectedLine]);

  // Memoizar los pasos del procedimiento
  const procedureSteps = useMemo(() => {
    return analysisData?.totals?.procedure || [];
  }, [analysisData?.totals?.procedure]);

  // Memoizar los símbolos
  const symbols = useMemo(() => {
    return analysisData?.totals?.symbols || {};
  }, [analysisData?.totals?.symbols]);

  // Memoizar las notas
  const notes = useMemo(() => {
    return analysisData?.totals?.notes || [];
  }, [analysisData?.totals?.notes]);

  // Optimizar el manejo de scroll con debouncing
  const handleScroll = useCallback((_e: React.UIEvent<HTMLDivElement>) => {
    if (scrollDebounce) {
      clearTimeout(scrollDebounce);
    }
    
    const timeout = setTimeout(() => {
      // Aquí podríamos agregar lógica adicional si es necesario
      setScrollDebounce(null);
    }, 16); // ~60fps
    
    setScrollDebounce(timeout);
  }, [scrollDebounce]);

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
      if (scrollDebounce) {
        clearTimeout(scrollDebounce);
      }
    };
  }, [open, onClose, scrollDebounce]);

  if (!open) return null;

  const isLineProcedure = selectedLine !== null && selectedLine !== undefined;

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
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-custom"
          onScroll={handleScroll}
          style={{ 
            scrollBehavior: 'smooth',
            willChange: 'scroll-position'
          }}
        >
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
                    {procedureSteps.length > 20 ? (
                      <VirtualizedStepsList steps={procedureSteps} />
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-custom">
                        {procedureSteps.map((step, index) => (
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
                    )}
                  </div>

                  {/* Símbolos */}
                  {Object.keys(symbols).length > 0 && (
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">Símbolos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-custom">
                        {Object.entries(symbols).map(([symbol, description]) => (
                          <div key={symbol} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded border border-white/10">
                            <div className="flex-shrink-0">
                              <RenderVariable variable={symbol} />
                            </div>
                            <span className="text-slate-300 text-xs">= {description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  {notes.length > 0 && (
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">Notas</h4>
                      <ul className="space-y-2 max-h-32 overflow-y-auto scrollbar-custom">
                        {notes.map((note, index) => (
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