"use client";

import React, { useMemo, useEffect, useState } from "react";
import type { AnalyzeOpenResponse } from "@aa/types";
import Formula from "./Formula";
import RecursiveProcedureModal from "./RecursiveProcedureModal";
import IterationProcedureModal from "./IterationProcedureModal";
import RecursionTreeProcedureModal from "./RecursionTreeProcedureModal";
import RecursionTreeStepsModal from "./RecursionTreeStepsModal";
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
    const iteration = worstData?.totals?.iteration || bestData?.totals?.iteration || avgData?.totals?.iteration;
    const recursionTree = worstData?.totals?.recursion_tree || bestData?.totals?.recursion_tree || avgData?.totals?.recursion_tree;
    const proof = worstData?.totals?.proof || bestData?.totals?.proof || avgData?.totals?.proof;
    const theta = recursionTree?.theta || iteration?.theta || worstData?.totals?.master?.theta || bestData?.totals?.master?.theta || avgData?.totals?.master?.theta;
    const T_open = worstData?.totals?.T_open || bestData?.totals?.T_open || avgData?.totals?.T_open;

    return { worstData, bestData, avgData, recurrence, master, iteration, recursionTree, proof, theta, T_open };
  }, [data]);

  const { worstData, bestData, avgData, recurrence, master, iteration, recursionTree, proof, theta, T_open } = analysisData;
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  
  // Detectar método usado
  const isIterationMethod = recurrence?.method === "iteration";
  const isRecursionTreeMethod = recurrence?.method === "recursion_tree";
  
  // Obtener T_open para cada caso
  const bestT = bestData?.totals?.T_open || bestData?.totals?.recursion_tree?.theta || bestData?.totals?.iteration?.theta || bestData?.totals?.master?.theta_best || bestData?.totals?.master?.theta || theta || "N/A";
  const worstT = worstData?.totals?.T_open || worstData?.totals?.recursion_tree?.theta || worstData?.totals?.iteration?.theta || worstData?.totals?.master?.theta || theta || "N/A";
  const avgT = avgData?.totals?.T_open || avgData?.totals?.recursion_tree?.theta || avgData?.totals?.iteration?.theta || avgData?.totals?.master?.theta || theta || "N/A";
  
  // Detectar si hay diferencias entre los casos
  const hasDifferentComplexities = bestT !== worstT || bestT !== avgT || worstT !== avgT;

  // Debug: log solo una vez cuando cambian los datos
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && recurrence) {
      console.log('[RecursiveAnalysisView] Datos cargados:', {
        hasRecurrence: !!recurrence,
        hasMaster: !!master,
        hasIteration: !!iteration,
        hasRecursionTree: !!recursionTree,
        hasProof: !!proof,
        method: recurrence.method,
        theta,
        T_open
      });
    }
  }, [recurrence, master, iteration, recursionTree, proof, theta, T_open]);

  if (!recurrence || (!master && !iteration && !recursionTree)) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl mb-2 block">hourglass_empty</span>
          <p>Ejecuta el análisis para ver los resultados</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-red-400">
              <p>Debug: recurrence={recurrence ? '✓' : '✗'}, master={master ? '✓' : '✗'}, iteration={iteration ? '✓' : '✗'}, recursionTree={recursionTree ? '✓' : '✗'}</p>
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
            <span className={`material-symbols-outlined ${
              isIterationMethod 
                ? 'text-purple-400'
                : isRecursionTreeMethod
                ? 'text-cyan-400'
                : 'text-orange-400'
            }`}>
              {isIterationMethod 
                ? 'unfold_more' 
                : isRecursionTreeMethod
                ? 'account_tree'
                : 'science'}
            </span>
            <span>Método de Análisis</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border tracking-wide ${
              isIterationMethod 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : isRecursionTreeMethod
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
            }`}>
              {isIterationMethod 
                ? 'Método de Iteración' 
                : isRecursionTreeMethod
                ? 'Árbol de Recursión'
                : 'Teorema Maestro'}
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

        {/* Botones para ver detalles y pasos */}
        <div className={`mb-4 ${isRecursionTreeMethod && proof && proof.length > 0 ? 'grid grid-cols-2 gap-3' : ''}`}>
          <button
            onClick={() => setShowProcedureModal(true)}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-sky-500/20 transition-colors ${isRecursionTreeMethod && proof && proof.length > 0 ? '' : 'w-full'}`}
          >
            <span className="material-symbols-outlined text-sm">info</span>
            <span>Ver Detalles</span>
          </button>
          {isRecursionTreeMethod && proof && proof.length > 0 && (
            <button
              onClick={() => setShowStepsModal(true)}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-white glass-secondary hover:bg-purple-500/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">description</span>
              <span>Ver Paso a Paso</span>
            </button>
          )}
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

      {/* Card de costos o información del método de Árbol de Recursión */}
      {isRecursionTreeMethod && recursionTree ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nivel Dominante */}
          <div className="glass-card p-3 rounded-lg shadow-[0_8px_32px_0_rgba(6,182,212,0.3)] hover:shadow-[0_12px_40px_0_rgba(6,182,212,0.4)] h-full flex flex-col">
            <div className="flex flex-col gap-2 flex-1">
              <h3 className="font-semibold text-cyan-300 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">trending_up</span>
                <span>Nivel Dominante</span>
              </h3>
              <div className="bg-slate-800/60 p-3 rounded border border-white/10 flex flex-col items-center justify-center gap-2 flex-1 min-h-[120px]">
                <div className="text-base font-semibold text-cyan-300 text-center">
                  {recursionTree.dominating_level?.level === "leaves" && "Dominan las hojas"}
                  {recursionTree.dominating_level?.level === "root" && "Domina la raíz"}
                  {recursionTree.dominating_level?.level === "all" && "Trabajo equilibrado"}
                  {!recursionTree.dominating_level?.level && "Nivel dominante"}
                </div>
                <div className="text-center overflow-x-auto w-full max-w-full">
                  <div className="text-xs scale-85">
                    <Formula latex={recursionTree.dominating_level?.reason || ""} display />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Ecuación de Eficiencia */}
          <div className="glass-card p-3 rounded-lg shadow-[0_8px_32px_0_rgba(6,182,212,0.3)] hover:shadow-[0_12px_40px_0_rgba(6,182,212,0.4)] h-full flex flex-col">
            <div className="flex flex-col gap-2 flex-1">
              <h3 className="font-semibold text-cyan-300 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">functions</span>
                <span>Ecuación de Eficiencia</span>
              </h3>
              <div className="bg-slate-800/60 p-3 rounded border border-white/10 flex flex-col items-center justify-center gap-3 overflow-x-auto flex-1 min-h-[120px]">
                {hasDifferentComplexities ? (
                  <>
                    <div className="text-center">
                      <div className="text-xs text-green-300 mb-1">Mejor caso:</div>
                      <Formula latex={`T(n) = ${bestT}`} display />
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-yellow-300 mb-1">Caso promedio:</div>
                      <Formula latex={`T(n) = ${avgT}`} display />
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-red-300 mb-1">Peor caso:</div>
                      <Formula latex={`T(n) = ${worstT}`} display />
                    </div>
                  </>
                ) : (
                  <Formula latex={`T(n) = ${theta || recursionTree.theta || worstT || "N/A"}`} display />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 rounded-lg text-center shadow-[0_8px_32px_0_rgba(34,197,94,0.3)] hover:shadow-[0_12px_40px_0_rgba(34,197,94,0.4)]">
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <div className="scale-110">
                  <Formula latex={bestData?.totals?.T_open || bestData?.totals?.recursion_tree?.theta || bestData?.totals?.iteration?.theta || bestData?.totals?.master?.theta_best || bestData?.totals?.master?.theta || theta || "N/A"} />
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
                  <Formula latex={avgData?.totals?.T_open || avgData?.totals?.recursion_tree?.theta || avgData?.totals?.iteration?.theta || avgData?.totals?.master?.theta || theta || "N/A"} />
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
                  <Formula latex={worstData?.totals?.T_open || worstData?.totals?.recursion_tree?.theta || worstData?.totals?.iteration?.theta || worstData?.totals?.master?.theta || theta || "N/A"} />
                </div>
              </div>
              <h3 className="font-semibold text-red-300 mb-1">Peor caso</h3>
              <p className="text-xs text-slate-400">En algoritmos recursivos divide-and-conquer, los casos suelen ser iguales</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de procedimiento completo */}
      {isIterationMethod ? (
        <IterationProcedureModal
          open={showProcedureModal}
          onClose={() => setShowProcedureModal(false)}
          data={worstData || bestData || avgData}
          recurrence={recurrence}
          iteration={iteration}
          proof={proof}
          theta={theta || T_open}
        />
      ) : isRecursionTreeMethod ? (
        <RecursionTreeProcedureModal
          open={showProcedureModal}
          onClose={() => setShowProcedureModal(false)}
          data={worstData || bestData || avgData}
          recurrence={recurrence}
          recursionTree={recursionTree}
          proof={proof}
          theta={theta || T_open}
        />
      ) : (
      <RecursiveProcedureModal
        open={showProcedureModal}
        onClose={() => setShowProcedureModal(false)}
        data={worstData || bestData || avgData}
        recurrence={recurrence}
        master={master}
        proof={proof}
        theta={theta || T_open}
      />
      )}

      {/* Modal del árbol de recursión */}
      <RecursionTreeModal
        open={showTreeModal}
        onClose={() => setShowTreeModal(false)}
        recurrence={recurrence}
        recursionTreeData={recursionTree}
      />

      {/* Modal de pasos del método de Árbol de Recursión */}
      {isRecursionTreeMethod && (
        <RecursionTreeStepsModal
          open={showStepsModal}
          onClose={() => setShowStepsModal(false)}
          proof={proof}
        />
      )}
    </div>
  );
}

