"use client";

import React, { useMemo, useEffect, useState } from "react";
import type { AnalyzeOpenResponse } from "@aa/types";
import Formula from "./Formula";
import RecursiveProcedureModal from "./RecursiveProcedureModal";
import RecursionTreeModal from "./RecursionTreeModal";

interface RecursiveAnalysisViewProps {
  data: {
    worst: AnalyzeOpenResponse | null;
    best: AnalyzeOpenResponse | null;
    avg: AnalyzeOpenResponse | null;
  } | null;
}

export default function RecursiveAnalysisView({ data }: RecursiveAnalysisViewProps) {
  // Memoizar los datos para evitar recálculos innecesarios
  const analysisData = useMemo(() => {
    const worstData = data?.worst;
    const bestData = data?.best;
    const avgData = data?.avg;
    
    const recurrence = worstData?.totals?.recurrence || bestData?.totals?.recurrence || avgData?.totals?.recurrence;
    const master = worstData?.totals?.master || bestData?.totals?.master || avgData?.totals?.master;
    const proof = worstData?.totals?.proof || bestData?.totals?.proof || avgData?.totals?.proof;
    const theta = worstData?.totals?.master?.theta || bestData?.totals?.master?.theta || avgData?.totals?.master?.theta;
    const T_open = worstData?.totals?.T_open || bestData?.totals?.T_open || avgData?.totals?.T_open;

    return { worstData, bestData, avgData, recurrence, master, proof, theta, T_open };
  }, [data]);

  const { worstData, bestData, avgData, recurrence, master, proof, theta, T_open } = analysisData;
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);

  // Debug: log solo una vez cuando cambian los datos
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && recurrence && master) {
      console.log('[RecursiveAnalysisView] Datos cargados:', {
        hasRecurrence: !!recurrence,
        hasMaster: !!master,
        hasProof: !!proof,
        theta,
        T_open
      });
    }
  }, [recurrence, master, proof, theta, T_open]);

  if (!recurrence || !master) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl mb-2 block">hourglass_empty</span>
          <p>Ejecuta el análisis para ver los resultados</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-red-400">
              <p>Debug: recurrence={recurrence ? '✓' : '✗'}, master={master ? '✓' : '✗'}</p>
              <p>Data structure: {JSON.stringify({ 
                hasWorst: !!worstData, 
                hasBest: !!bestData, 
                hasAvg: !!avgData 
              })}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card principal: Método y Parámetros */}
      <div className="glass-card p-6 rounded-lg">
        <div className="mb-4">
          <h2 className="text-white font-semibold flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-orange-400">science</span>
            <span>Método de Análisis</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border tracking-wide bg-orange-500/20 text-orange-300 border-orange-500/30">
              Teorema Maestro
            </span>
          </h2>
        </div>

        {/* Parámetros de la recurrencia */}
        <div className="mb-4">
          <h3 className="text-white font-semibold text-sm mb-3">Parámetros de la Recurrencia</h3>
          <div className="flex flex-wrap items-center justify-center gap-1">
            <Formula latex={`a = ${recurrence.a}`} />
            <span className="text-slate-300">,</span>
            <Formula latex={`b = ${recurrence.b}`} />
            <span className="text-slate-300">,</span>
            <Formula latex={`f(n) = ${recurrence.f}`} />
            <span className="text-slate-300">,</span>
            <Formula latex={`n_0 = ${recurrence.n0}`} />
          </div>
        </div>

        {/* Ecuación de Recurrencia */}
        <div className="mb-4">
          <h3 className="text-white font-semibold text-sm mb-2">Ecuación de Recurrencia</h3>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-white/10 flex justify-center">
            <Formula latex={recurrence.form} />
          </div>
        </div>

        {/* Botón para ver procedimiento completo */}
        <div className="mb-4">
          <button
            onClick={() => setShowProcedureModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-sky-500/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            <span>Ver Procedimiento Completo</span>
          </button>
        </div>

        {/* Botón para árbol de recurrencia */}
        <div className="mb-4">
          <button
            onClick={() => setShowTreeModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-purple-500/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">account_tree</span>
            <span>Ver Árbol de Recurrencia</span>
          </button>
        </div>
      </div>

      {/* Card de costos (normalmente son iguales en recursivos) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-lg text-center shadow-[0_8px_32px_0_rgba(34,197,94,0.3)] hover:shadow-[0_12px_40px_0_rgba(34,197,94,0.4)]">
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <div className="scale-110">
                <Formula latex={bestData?.totals?.master?.theta || bestData?.totals?.T_open || theta || "N/A"} />
              </div>
            </div>
            <h3 className="font-semibold text-green-300 mb-1">Mejor caso</h3>
            <p className="text-xs text-slate-400">En algoritmos recursivos divide-and-conquer, los casos suelen ser iguales</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-lg text-center shadow-[0_8px_32px_0_rgba(234,179,8,0.3)] hover:shadow-[0_12px_40px_0_rgba(234,179,8,0.4)]">
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
              <div className="scale-110">
                <Formula latex={avgData?.totals?.master?.theta || avgData?.totals?.T_open || theta || "N/A"} />
              </div>
            </div>
            <h3 className="font-semibold text-yellow-300 mb-1">Caso promedio</h3>
            <p className="text-xs text-slate-400">En algoritmos recursivos divide-and-conquer, los casos suelen ser iguales</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-lg text-center shadow-[0_8px_32px_0_rgba(239,68,68,0.3)] hover:shadow-[0_12px_40px_0_rgba(239,68,68,0.4)]">
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <div className="scale-110">
                <Formula latex={worstData?.totals?.master?.theta || worstData?.totals?.T_open || theta || "N/A"} />
              </div>
            </div>
            <h3 className="font-semibold text-red-300 mb-1">Peor caso</h3>
            <p className="text-xs text-slate-400">En algoritmos recursivos divide-and-conquer, los casos suelen ser iguales</p>
          </div>
        </div>
      </div>

      {/* Modal de procedimiento completo */}
      <RecursiveProcedureModal
        open={showProcedureModal}
        onClose={() => setShowProcedureModal(false)}
        data={worstData || bestData || avgData}
        recurrence={recurrence}
        master={master}
        proof={proof}
        theta={theta || T_open}
      />

      {/* Modal del árbol de recursión */}
      <RecursionTreeModal
        open={showTreeModal}
        onClose={() => setShowTreeModal(false)}
        recurrence={recurrence}
      />
    </div>
  );
}

