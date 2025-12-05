"use client";

import { useState, useEffect } from "react";

import type { ExecutionStep, TraceApiResponse } from "@/types/trace";

import Formula from "../Formula";

interface StepInfoProps {
  stepData: ExecutionStep | null;
  loading: boolean;
  trace: TraceApiResponse | null;
  currentStep: number;
  loadingDiagram?: boolean;
}

// Helper function to format microseconds with appropriate units
const formatMicroseconds = (microseconds: number): string => {
  if (microseconds < 1) {
    return `${(microseconds * 1000).toFixed(2)} ns`;
  } else if (microseconds < 1000) {
    return `${microseconds.toFixed(2)} μs`;
  } else if (microseconds < 1000000) {
    return `${(microseconds / 1000).toFixed(2)} ms`;
  } else {
    return `${(microseconds / 1000000).toFixed(2)} s`;
  }
};

// Helper function to format accumulated cost with abbreviation for long expressions
const formatAccumulatedCost = (cost: string): string => {
  // Check if it's a sum expression (contains +)
  if (!cost.includes('+')) return cost;

  // Split by + and trim whitespace
  const terms = cost.split('+').map(t => t.trim());

  // If 4 or more terms, abbreviate
  if (terms.length >= 4) {
    // Extract c_x values and format with proper subscript notation
    const formatTerm = (term: string) => {
      // Match c_number or C_number pattern
      const match = term.match(/[cC]_(\d+)/);
      if (match) {
        const num = match[1];
        // Use curly braces for multi-digit subscripts
        return num.length > 1 ? `c_{${num}}` : `c_${num}`;
      }
      return term;
    };

    const first = formatTerm(terms[0]);
    const second = formatTerm(terms[1]);
    const third = formatTerm(terms[2]);
    const last = formatTerm(terms[terms.length - 1]);

    return `${first} + ${second} + ${third} + \\ldots + ${last}`;
  }

  // For less than 4 terms, format each term properly
  return terms.map(term => {
    const match = term.match(/[cC]_(\d+)/);
    if (match) {
      const num = match[1];
      return num.length > 1 ? `c_{${num}}` : `c_${num}`;
    }
    return term;
  }).join(' + ');
};

export default function StepInfo({
  stepData,
  loading,
  trace,
  currentStep,
  loadingDiagram = false,
}: StepInfoProps) {
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [expandedIteration, setExpandedIteration] = useState(false);

  // Reset expanded states when step changes
  useEffect(() => {
    setExpandedDescription(false);
    setExpandedIteration(false);
  }, [currentStep]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-custom">
      {loading ? (
        <div className="h-full flex flex-col items-center justify-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
            <div className="absolute w-6 h-6 bg-blue-500 rounded-full" />
          </div>
          <p className="text-xs text-slate-300">
            Ejecutando rastro de ejecución...
          </p>
        </div>
      ) : trace?.ok && stepData ? (
        <div className="space-y-3 animate-fade-in" key={currentStep}>
          {/* Grid for Line, Type, Cost, Microseconds, Tokens */}
          <div className={`grid gap-2 ${stepData.cost ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <div className="glass-card p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col">
              <div className="text-xs text-blue-300 mb-2 font-bold text-center">Línea</div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-white font-semibold text-sm">
                  {stepData.line}
                </div>
              </div>
            </div>

            <div className="glass-card p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 flex flex-col">
              <div className="text-xs text-purple-300 mb-2 font-bold text-center">Tipo</div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-white font-semibold capitalize text-sm">
                  {stepData.kind}
                </div>
              </div>
            </div>

            {stepData.cost && (
              <div className="glass-card p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 flex flex-col">
                <div className="text-xs text-orange-300 mb-2 font-bold text-center">Coste</div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-white text-sm text-center">
                    <Formula latex={stepData.cost} />
                    {stepData.accumulated_cost && (
                      <div className="text-slate-400 text-xs mt-1">
                        Acum: <Formula latex={formatAccumulatedCost(stepData.accumulated_cost)} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Microsegundos - mostrar siempre, con loader si está cargando */}
            <div className="glass-card p-2 rounded-lg bg-green-500/10 border border-green-500/20 flex flex-col">
              <div className="text-xs text-green-300 mb-2 font-bold text-center">Microsegundos</div>
              <div className="flex-1 flex items-center justify-center">
                {loadingDiagram && stepData?.microseconds === undefined ? (
                  <div className="w-4 h-4 border-2 border-green-300/50 border-t-green-300 rounded-full animate-spin" />
                ) : stepData?.microseconds !== undefined ? (
                  <div className="text-white font-semibold text-sm">
                    {formatMicroseconds(stepData.microseconds)}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs">-</div>
                )}
              </div>
            </div>

            {/* Tokens - mostrar siempre, con loader si está cargando */}
            <div className="glass-card p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex flex-col">
              <div className="text-xs text-cyan-300 mb-2 font-bold text-center">Tokens</div>
              <div className="flex-1 flex items-center justify-center">
                {loadingDiagram && stepData?.tokens === undefined ? (
                  <div className="w-4 h-4 border-2 border-cyan-300/50 border-t-cyan-300 rounded-full animate-spin" />
                ) : stepData?.tokens !== undefined ? (
                  <div className="text-white font-semibold text-sm">
                    {stepData.tokens}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs">-</div>
                )}
              </div>
            </div>
          </div>

          {/* Expandable badges for Description and Iteration */}
          {(stepData.description || stepData.iteration) && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {stepData.description && (
                  <button
                    onClick={() => {
                      setExpandedDescription(!expandedDescription);
                      if (!expandedDescription) setExpandedIteration(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 transition-all text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {expandedDescription ? "expand_less" : "expand_more"}
                    </span>
                    Descripción
                  </button>
                )}

                {stepData.iteration && (
                  <button
                    onClick={() => {
                      setExpandedIteration(!expandedIteration);
                      if (!expandedIteration) setExpandedDescription(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 transition-all text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {expandedIteration ? "expand_less" : "expand_more"}
                    </span>
                    Iteración{stepData.iteration.iteration ? ` #${stepData.iteration.iteration}` : ""}
                  </button>
                )}
              </div>

              {/* Expanded content area */}
              {expandedDescription && stepData.description && (
                <div className="glass-card p-3 rounded-lg animate-fade-in min-h-[80px]">
                  <div className="bg-slate-800/40 rounded px-3 py-2 border border-white/5">
                    <div className="text-xs text-slate-400 mb-1">Descripción del paso</div>
                    <div className="text-white text-sm font-medium">
                      {stepData.description}
                    </div>
                  </div>
                </div>
              )}

              {expandedIteration && stepData.iteration && (
                <div className="glass-card p-3 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 animate-fade-in min-h-[80px]">
                  {stepData.iteration.loopVar && (
                    <div className="bg-slate-800/40 rounded px-3 py-2 border border-white/5">
                      <div className="text-xs text-slate-400 mb-1">Variable de iteración</div>
                      <div className="text-white text-sm font-medium">
                        <Formula latex={`${stepData.iteration.loopVar} = ${stepData.iteration.currentValue}${stepData.iteration.maxValue ? ` / ${stepData.iteration.maxValue}` : ""}`} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {stepData.recursion && (
            <div className="glass-card p-3 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">
                Recursión:
              </div>
              <div className="text-white text-sm">
                <div>
                  Profundidad: {stepData.recursion.depth}
                </div>
                {stepData.recursion.procedure && (
                  <div>
                    Procedimiento:{" "}
                    {stepData.recursion.procedure}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Variables with colorful styling and flex-wrap layout */}
          <div className="glass-card p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
            <div className="text-xs text-cyan-300 mb-2 font-semibold">Variables:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stepData.variables).map(
                ([key, value]) => {
                  const strValue = String(value);
                  const isLarge = strValue.length > 20 || strValue.includes('[');

                  return (
                    <div
                      key={key}
                      className={`bg-slate-800/40 rounded px-2 py-1.5 border border-white/5 flex items-center gap-2 ${isLarge ? "w-full" : "flex-shrink-0"
                        }`}
                    >
                      <span className="text-cyan-200 text-sm font-medium flex-shrink-0">{key}:</span>
                      <div className={`text-white text-sm font-mono ${isLarge ? "flex-1 overflow-x-auto scrollbar-thin" : ""
                        }`}>
                        <Formula latex={strValue} />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl opacity-50">
              data_object
            </span>
          </div>
          <div className="text-sm font-medium">
            {trace?.errors
              ? trace.errors[0]?.message || "Error al cargar el rastro"
              : "No hay datos de seguimiento disponibles"}
          </div>
        </div>
      )}
    </div>
  );
}

