"use client";

import React from "react";

interface DPVersionModalProps {
  open: boolean;
  onClose: () => void;
  characteristicEquation: {
    method: "characteristic_equation";
    is_dp_linear: boolean;
    equation: string;
    roots: Array<{
      root: string;
      multiplicity: number;
    }>;
    homogeneous_solution: string;
    particular_solution?: string;
    closed_form: string;
    dp_version?: {
      code: string;
      time_complexity: string;
      space_complexity: string;
      recursive_complexity: string;
    };
    dp_equivalence: string;
    theta: string;
  } | null | undefined;
}

export default function DPVersionModal({
  open,
  onClose,
  characteristicEquation,
}: Readonly<DPVersionModalProps>) {
  if (!open || !characteristicEquation?.dp_version) return null;

  const dpVersion = characteristicEquation.dp_version;

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
      <div className="absolute left-1/2 top-1/2 w-[min(95vw,900px)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400">memory</span>
            Versión Programación Dinámica
          </h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
          <div className="space-y-6">
            {/* Comparación de Complejidades */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
              <h4 className="text-white font-semibold mb-4">Comparación de Complejidades</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="text-red-300 font-semibold text-sm mb-1">Versión Recursiva</div>
                  <div className="text-red-200 text-lg font-bold">{dpVersion.recursive_complexity}</div>
                  <div className="text-slate-400 text-xs mt-1">Complejidad exponencial</div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="text-green-300 font-semibold text-sm mb-1">Versión DP</div>
                  <div className="text-green-200 text-lg font-bold">{dpVersion.time_complexity}</div>
                  <div className="text-slate-400 text-xs mt-1">Tiempo: {dpVersion.time_complexity}, Espacio: {dpVersion.space_complexity}</div>
                </div>
              </div>
            </div>

            {/* Código Pseudocódigo */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
              <h4 className="text-white font-semibold mb-4">Código Pseudocódigo DP</h4>
              <div className="bg-slate-900/80 p-4 rounded border border-white/10">
                <pre className="text-slate-200 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                  {dpVersion.code}
                </pre>
              </div>
            </div>

            {/* Explicación de Equivalencia */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h4 className="text-blue-300 font-semibold mb-2">Equivalencia Matemática</h4>
              <p className="text-slate-300 text-sm">{characteristicEquation.dp_equivalence}</p>
            </div>

            {/* Ventajas de DP */}
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <h4 className="text-green-300 font-semibold mb-3">Ventajas de la Versión DP</h4>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                  <span><strong>Complejidad temporal mejorada:</strong> De {dpVersion.recursive_complexity} a {dpVersion.time_complexity}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                  <span><strong>Sin recálculos:</strong> Cada subproblema se resuelve una sola vez</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                  <span><strong>Bottom-up:</strong> Construcción iterativa desde casos base</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                  <span><strong>Optimización de espacio:</strong> Puede reducirse a {dpVersion.space_complexity === "O(n)" ? "O(1)" : dpVersion.space_complexity} con optimización</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

