"use client";

import React from "react";
import Formula from "./Formula";

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
      <div className="absolute left-1/2 top-1/2 w-[min(95vw,900px)] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col">
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
        <div className="flex-1 overflow-y-auto p-5 scrollbar-custom">
          <div className="space-y-4">
            {/* Comparación de Complejidades */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
              <h4 className="text-white font-semibold mb-3 text-sm">Comparación de Complejidades</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="text-red-300 font-semibold text-xs mb-2">Versión Recursiva</div>
                  <div className="text-red-200 mb-2 flex justify-center">
                    <Formula latex={dpVersion.recursive_complexity} display />
                  </div>
                  <div className="text-slate-400 text-xs mt-1">Complejidad exponencial</div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="text-green-300 font-semibold text-xs mb-2">Versión DP</div>
                  <div className="text-green-200 mb-2 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">Tiempo:</span>
                      <Formula latex={dpVersion.time_complexity} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">Espacio:</span>
                      <Formula latex={dpVersion.space_complexity} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Código Pseudocódigo */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
              <h4 className="text-white font-semibold mb-3 text-sm">Pseudocódigo de Programación Dinámica</h4>
              <div className="bg-slate-900/80 p-3 rounded border border-white/10">
                <pre className="text-slate-200 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {dpVersion.code}
                </pre>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong className="text-blue-300">Cambios principales:</strong> Esta versión DP reemplaza las llamadas recursivas por un enfoque iterativo bottom-up. 
                  En lugar de calcular recursivamente los subproblemas (que pueden repetirse múltiples veces), se construye una tabla/matriz 
                  que almacena los resultados de los subproblemas desde los casos base hasta el problema original. 
                  Cada valor se calcula una sola vez y se reutiliza cuando es necesario, eliminando los recálculos redundantes 
                  que causan la complejidad exponencial en la versión recursiva.
                </p>
              </div>
            </div>

            {/* Explicación de Equivalencia */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h4 className="text-blue-300 font-semibold mb-2 text-sm">Equivalencia Matemática</h4>
              <p className="text-slate-300 text-xs leading-relaxed">{characteristicEquation.dp_equivalence}</p>
            </div>

            {/* Ventajas de DP */}
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <h4 className="text-green-300 font-semibold mb-2 text-sm">Ventajas de la Versión DP</h4>
              <ul className="space-y-1.5 text-slate-300 text-xs">
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

