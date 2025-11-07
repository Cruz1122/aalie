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


  // Función para extraer el patrón de un término (n+1, n, 1, etc.)
  const extractPattern = (count: string): string => {
    // Normalizar espacios y paréntesis
    const normalized = count.replaceAll(/\s+/g, '').replaceAll(/\(/g, '').replaceAll(/\)/g, '');
    
    // Mapeo de patrones comunes
    const patternMap: Record<string, string> = {
      '1': '1',
      'n': 'n',
      'n+1': 'n+1',
      '1+n': 'n+1',
      'n-1': 'n-1',
      '-1+n': 'n-1'
    };
    
    // Verificar patrones exactos primero
    if (patternMap[normalized]) {
      return patternMap[normalized];
    }
    
    // Verificar patrones que contienen subcadenas
    if (normalized.includes('n^2') || normalized.includes('n²')) return 'n²';
    if (normalized.includes('n^3') || normalized.includes('n³')) return 'n³';
    if (normalized.includes('log') || normalized.includes('ln')) return 'log(n)';
    
    // Si contiene n pero no es un patrón conocido, devolver como está
    if (normalized.includes('n')) return normalized;
    
    // Constante por defecto
    return '1';
  };

  // Función para agrupar términos similares
  const groupSimilarTerms = (terms: Array<{ck: string, count: string}>): string => {
    const groups: Record<string, string[]> = {};
    
    // Agrupar términos por patrón
    for (const term of terms) {
      const pattern = extractPattern(term.count);
      if (!groups[pattern]) {
        groups[pattern] = [];
      }
      groups[pattern].push(term.ck);
    }
    
    // Construir la ecuación agrupada
    const groupedTerms = Object.entries(groups).map(([pattern, coefficients]) => {
      const coefficientStr = coefficients.length === 1 
        ? coefficients[0] 
        : `(${coefficients.join(' + ')})`;
      
      return `${coefficientStr} \\cdot (${pattern})`;
    });
    
    return groupedTerms.join(' + ');
  };


  // Función para crear la forma final más simplificada
  const createFinalSimplifiedForm = (groupedEquation: string): string => {
    // Si la ecuación está vacía, devolver una forma genérica
    if (!groupedEquation || groupedEquation.trim() === '') {
      return 'T(n) = O(1)';
    }
    
    // Detectar el tipo de complejidad basado en los patrones presentes
    const complexityTypes = {
      quadratic: groupedEquation.includes('n²') || groupedEquation.includes('n^2'),
      linear: groupedEquation.includes('n+1') || groupedEquation.includes('n-1') || groupedEquation.includes(' n '),
      constant: groupedEquation.includes('1)') || groupedEquation.includes(' 1 '),
      logarithmic: groupedEquation.includes('log')
    };
    
    // Construir la forma final con nomenclatura consistente: an² + bn + c
    const terms: string[] = [];
    let coefficientIndex = 0;
    const coefficients = ['a', 'b', 'c', 'd', 'e', 'f'];
    
    if (complexityTypes.quadratic) {
      terms.push(`${coefficients[coefficientIndex++]} \\cdot n^2`);
    }
    if (complexityTypes.linear) {
      terms.push(`${coefficients[coefficientIndex++]} \\cdot n`);
    }
    if (complexityTypes.constant) {
      terms.push(coefficients[coefficientIndex++]);
    }
    if (complexityTypes.logarithmic) {
      terms.push(`${coefficients[coefficientIndex++]} \\cdot \\log(n)`);
    }
    
    // Si no se detectó ningún patrón específico, usar la ecuación original
    if (terms.length === 0) {
      return groupedEquation;
    }
    
    return terms.join(' + ');
  };

  // Memoizar las ecuaciones de derivación
  const derivationSteps = useMemo(() => {
    if (!analysisData?.byLine) return [];
    
    // Paso 1: Ecuación completa con count_raw
    const step1 = analysisData.byLine
      .map(line => `${line.ck} \\cdot (${line.count_raw})`)
      .join(' + ');
    
    // Paso 2: Ecuación con count simplificado
    const step2 = analysisData.byLine
      .map(line => `${line.ck} \\cdot (${line.count})`)
      .join(' + ');
    
    // Paso 3: Agrupación de términos similares
    const step3 = groupSimilarTerms(analysisData.byLine.map(line => ({ ck: line.ck, count: line.count })));
    
    // Paso 4: Forma final con constantes a, b, c, etc.
    const step4 = createFinalSimplifiedForm(step3);
    
    // Crear array de pasos con sus ecuaciones
    const allSteps = [
      { title: "Ecuación completa con sumatorias", equation: step1, description: "Ecuación original con todas las sumatorias y multiplicadores aplicados" },
      { title: "Simplificación de sumatorias", equation: step2, description: "Se resuelven las sumatorias y se simplifican los términos" },
      { title: "Agrupación de términos similares", equation: step3, description: "Se agrupan los términos por patrones similares (n+1, n, constantes)" },
      { title: "Forma final en términos de n", equation: step4, description: "Forma final simplificada en términos de n con constantes a, b, c, etc." }
    ];
    
    // Filtrar pasos que son diferentes al anterior
    const filteredSteps = allSteps.filter((step, index) => {
      if (index === 0) return true; // Siempre mostrar el primer paso
      
      const previousStep = allSteps[index - 1];
      return step.equation !== previousStep.equation;
    });
    
    return filteredSteps;
  }, [analysisData]);

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
              {analysisData && (() => {
                const lineData = analysisData.byLine.find(line => line.line === selectedLine);
                if (!lineData) {
                  return (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-red-300">No se encontró información para la línea {selectedLine}</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Información de la línea */}
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">Análisis de Línea {selectedLine}</h4>
                      
                      {/* Tipo de operación */}
                      <div className="mb-4">
                        <span className="text-sm font-medium text-slate-400">Tipo de operación:</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            lineData.kind === 'assign' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                            lineData.kind === 'if' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                            lineData.kind === 'for' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                            lineData.kind === 'while' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                            lineData.kind === 'repeat' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                            lineData.kind === 'call' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                            lineData.kind === 'return' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' :
                            lineData.kind === 'decl' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                            'bg-gray-500/20 text-gray-300 border-gray-500/30'
                          }`}>
                            {lineData.kind === 'assign' ? 'Asignación' :
                             lineData.kind === 'if' ? 'Condicional' :
                             lineData.kind === 'for' ? 'Bucle For' :
                             lineData.kind === 'while' ? 'Bucle While' :
                             lineData.kind === 'repeat' ? 'Bucle Repeat' :
                             lineData.kind === 'call' ? 'Llamada' :
                             lineData.kind === 'return' ? 'Retorno' :
                             lineData.kind === 'decl' ? 'Declaración' :
                             'Otro'}
                          </span>
                        </div>
                      </div>

                      {/* Costo elemental */}
                      <div className="mb-4">
                        <span className="text-sm font-medium text-slate-400">Costo elemental (C<sub>k</sub>):</span>
                        <div className="mt-2 p-3 rounded bg-slate-900/50 border border-blue-500/20 overflow-x-auto scrollbar-custom">
                          <Formula latex={lineData.ck} display />
                        </div>
                        <p className="text-slate-300 mt-1 text-xs">
                          Costo computacional básico de esta operación
                        </p>
                      </div>

                      {/* Número de ejecuciones */}
                      <div className="mb-4">
                        <span className="text-sm font-medium text-slate-400">Número de ejecuciones:</span>
                        <div className="mt-2 p-3 rounded bg-slate-900/50 border border-amber-500/20 overflow-x-auto scrollbar-custom">
                          <Formula latex={lineData.count} display />
                        </div>
                        <p className="text-slate-300 mt-1 text-xs">
                          Cuántas veces se ejecuta esta línea
                        </p>
                      </div>

                      {/* Notas adicionales */}
                      {lineData.note && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-slate-400">Notas:</span>
                          <div className="mt-2 p-3 rounded bg-slate-900/50 border border-green-500/20">
                            <p className="text-slate-300 text-sm">{lineData.note}</p>
                          </div>
                        </div>
                      )}

                      {/* Fórmula de costo total */}
                      <div className="mb-4">
                        <span className="text-sm font-medium text-slate-400">Costo total de la línea:</span>
                        <div className="mt-2 p-3 rounded bg-slate-900/50 border border-purple-500/20 overflow-x-auto scrollbar-custom">
                          <Formula latex={`${lineData.ck} \\cdot ${lineData.count}`} display />
                        </div>
                        <p className="text-slate-300 mt-1 text-xs">
                          Producto del costo elemental por el número de ejecuciones
                        </p>
                      </div>
                    </div>

                    {/* Información adicional del análisis completo */}
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                      <h4 className="font-semibold text-white mb-3">Contexto del Análisis</h4>
                      
                      {/* Ecuación principal */}
                      <div className="mb-4">
                        <span className="text-sm font-medium text-slate-400">Ecuación de eficiencia completa:</span>
                        <div className="mt-2 p-3 rounded bg-slate-900/50 border border-white/10 overflow-x-auto scrollbar-custom">
                          <Formula latex={analysisData.totals.T_open} display />
                        </div>
                      </div>

                      {/* Pasos del procedimiento específico de la línea */}
                      {lineData.procedure && lineData.procedure.length > 0 && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-slate-400">Procedimiento de simplificación:</span>
                          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto scrollbar-custom">
                            {lineData.procedure.map((step, index) => (
                              <div key={index} className="flex items-start gap-2 p-2 bg-slate-900/50 rounded border border-white/10">
                                <div className="flex-shrink-0 w-5 h-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <Formula latex={step} display />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Símbolos */}
                      {analysisData.totals.symbols && Object.keys(analysisData.totals.symbols).length > 0 && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-slate-400">Símbolos utilizados:</span>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto scrollbar-custom">
                            {Object.entries(analysisData.totals.symbols).map(([symbol, description]) => (
                              <div key={symbol} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded border border-white/10">
                                <div className="flex-shrink-0">
                                  <Formula latex={symbol} />
                                </div>
                                <span className="text-slate-300 text-xs">= {description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notas generales */}
                      {analysisData.totals.notes && analysisData.totals.notes.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-slate-400">Notas generales:</span>
                          <ul className="mt-2 space-y-1 max-h-24 overflow-y-auto scrollbar-custom">
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
                  </div>
                );
              })()}
            </div>
          ) : (
            // Contenido general (análisis completo)
            <>
              {analysisData && (
                <div className="space-y-4">
                  {/* Ecuación principal */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">Ecuación de Eficiencia</h4>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10 overflow-x-auto scrollbar-custom">
                      <Formula latex={analysisData.totals.T_open} display />
                    </div>
                  </div>

                  {/* Pasos de derivación de la ecuación */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">Derivación de la Ecuación T(n)</h4>
                    <div className="space-y-4">
                      {derivationSteps.map((step, index) => {
                        const colors = [
                          { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/20' },
                          { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/20' },
                          { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/20' },
                          { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/20' }
                        ];
                        const color = colors[index] || colors[0];
                        
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 ${color.bg} ${color.text} rounded-full flex items-center justify-center text-xs font-medium`}>
                                {index + 1}
                              </div>
                              <h5 className="text-sm font-medium text-slate-300">{step.title}:</h5>
                            </div>
                            <div className={`ml-8 p-3 bg-slate-900/50 rounded-lg border ${color.border} overflow-x-auto scrollbar-custom`}>
                              <Formula latex={step.equation} display />
                            </div>
                            <p className="text-xs text-slate-400 ml-8">
                              {step.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
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