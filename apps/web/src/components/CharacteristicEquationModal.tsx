"use client";

import React from "react";
import Formula from "./Formula";

/**
 * Redondea los valores numéricos en una expresión LaTeX a 3 decimales.
 * @param latex - La expresión LaTeX que puede contener números
 * @returns La expresión LaTeX con números redondeados a 3 decimales
 * @author Juan Camilo Cruz Parra (@Cruz1122)
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

interface CharacteristicEquationModalProps {
  open: boolean;
  onClose: () => void;
  recurrence: (
    | {
        type: "divide_conquer";
        form: string;
        a: number;
        b: number;
        f: string;
        n0: number;
        applicable: boolean;
        notes: string[];
        method?: "master" | "iteration" | "recursion_tree";
      }
    | {
        type: "linear_shift";
        form: string;
        order: number;
        shifts: number[];
        coefficients: number[];
        "g(n)"?: string;
        n0: number;
        applicable: boolean;
        notes: string[];
        method?: "characteristic_equation";
      }
  ) | null | undefined;
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
    general_solution?: string;
    base_cases?: Record<string, number>;
    closed_form: string;
    dp_version?: {
      code: string;
      time_complexity: string;
      space_complexity: string;
      recursive_complexity: string;
    };
    dp_optimized_version?: {
      code: string;
      time_complexity: string;
      space_complexity: string;
    };
    dp_equivalence: string;
    theta: string;
  } | null | undefined;
  proof: Array<{
    id: string;
    text: string;
  }> | null | undefined;
  theta: string | null | undefined;
}

/**
 * Modal para mostrar los detalles del método de ecuación característica.
 * Incluye la ecuación, raíces, solución homogénea, particular (si aplica), forma cerrada y prueba.
 * 
 * @param props - Propiedades del modal
 * @returns Componente React del modal o null si está cerrado
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * 
 * @example
 * ```tsx
 * <CharacteristicEquationModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   recurrence={recurrence}
 *   characteristicEquation={characteristicEquation}
 *   proof={proof}
 *   theta={theta}
 * />
 * ```
 */
export default function CharacteristicEquationModal({
  open,
  onClose,
  recurrence,
  characteristicEquation,
  proof,
  theta,
}: Readonly<CharacteristicEquationModalProps>) {
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
      <div className="absolute left-1/2 top-1/2 w-[min(95vw,1200px)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-3 flex-shrink-0">
          <h3 className="text-base font-semibold text-white">Procedimiento Completo - Método de Ecuación Característica</h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Columna izquierda: Ecuación de Recurrencia y Solución */}
            <div className="space-y-4 lg:col-span-3">
              {/* Ecuación de Recurrencia */}
              {recurrence && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2">Ecuación de Recurrencia</h4>
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <div className="scale-90">
                      <Formula latex={recurrence.form} display />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1 mt-2 text-xs">
                    {recurrence.type === "linear_shift" ? (
                      recurrence["g(n)"] !== undefined && recurrence["g(n)"] !== null ? (
                        <>
                          <Formula latex={`g(n) = ${recurrence["g(n)"]}`} />
                          <span className="text-slate-300">,</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400 italic">g(n) = 0 (homogénea)</span>
                          <span className="text-slate-300">,</span>
                        </>
                      )
                    ) : (
                      <>
                        <Formula latex={`f(n) = ${recurrence.f}`} />
                        <span className="text-slate-300">,</span>
                      </>
                    )}
                    <Formula latex={`n_0 = ${recurrence.n0}`} />
                  </div>
                </div>
              )}

              {/* Ecuación Característica */}
              {characteristicEquation && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2">Ecuación Característica</h4>
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <div className="scale-90">
                      <Formula latex={characteristicEquation.equation} display />
                    </div>
                  </div>
                  
                  {/* Raíces como badges */}
                  {characteristicEquation.roots && characteristicEquation.roots.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <h5 className="text-slate-400 text-xs font-semibold mb-2">Raíces:</h5>
                      <div className="flex flex-wrap gap-2">
                        {characteristicEquation.roots.map((rootInfo, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-500/30 text-xs"
                          >
                            <span className="text-blue-300 font-semibold">r{idx + 1} =</span>
                            <div className="scale-90 origin-center">
                              <Formula latex={rootInfo.root} />
                            </div>
                            {rootInfo.multiplicity > 1 && (
                              <span className="text-blue-400/70 text-[10px]">(×{rootInfo.multiplicity})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Solución Homogénea */}
              {characteristicEquation && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2">Solución Homogénea</h4>
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <div className="scale-90">
                      <Formula latex={`T_h(n) = ${characteristicEquation.homogeneous_solution}`} display />
                    </div>
                  </div>
                </div>
              )}

              {/* Solución Particular */}
              {characteristicEquation && characteristicEquation.particular_solution && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2">Solución Particular</h4>
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <div className="scale-90">
                      <Formula latex={`T_p(n) = ${characteristicEquation.particular_solution}`} display />
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs mt-2">
                    Para encontrar la solución particular, asumimos una forma adecuada y sustituimos en la recurrencia.
                  </p>
                </div>
              )}

              {/* Solución General */}
              {characteristicEquation && (characteristicEquation.general_solution || characteristicEquation.particular_solution) && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2">Solución General</h4>
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <div className="scale-90">
                      {characteristicEquation.general_solution ? (
                        <Formula latex={`T(n) = ${characteristicEquation.general_solution}`} display />
                      ) : (
                        <Formula latex={`T(n) = T_h(n) + T_p(n) = ${characteristicEquation.homogeneous_solution} + ${characteristicEquation.particular_solution}`} display />
                      )}
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs mt-2">
                    {characteristicEquation.particular_solution 
                      ? "La solución general es la suma de la solución homogénea y la solución particular."
                      : "La solución general para la recurrencia homogénea."}
                  </p>
                </div>
              )}

              {/* Casos Base */}
              {characteristicEquation && characteristicEquation.base_cases && Object.keys(characteristicEquation.base_cases).length > 0 && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2">Casos Base Detectados</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(characteristicEquation.base_cases).map(([key, value], idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/20 border border-green-500/30 text-xs"
                      >
                        <span className="text-green-300 font-semibold">{key}</span>
                        <span className="text-slate-400">=</span>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-400 text-xs mt-2">
                    Casos base extraídos del algoritmo original.
                  </p>
                </div>
              )}

              {/* Forma Cerrada */}
              {characteristicEquation && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2">Forma Cerrada (Complejidad Asintótica)</h4>
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <div className="scale-90">
                      <Formula latex={`T(n) = ${characteristicEquation.closed_form}`} display />
                    </div>
                  </div>
                </div>
              )}

              {/* Equivalencia con DP */}
              {characteristicEquation && characteristicEquation.is_dp_linear && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="text-green-300 font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">memory</span>
                    Equivalencia con Programación Dinámica
                  </h4>
                  <p className="text-slate-300 text-xs">{characteristicEquation.dp_equivalence}</p>
                </div>
              )}
            </div>

            {/* Columna derecha: Resultado Final y Pasos */}
            <div className="space-y-4 lg:col-span-2">
              {/* Resultado Final */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                <h4 className="text-white font-semibold text-sm mb-2">Resultado Final</h4>
                <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                  <div className="scale-90">
                    <Formula latex={`T(n) = ${roundLatexNumbers(theta || characteristicEquation?.theta || "N/A")}`} display />
                  </div>
                </div>
              </div>

              {/* Pasos de Prueba */}
              {proof && proof.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2">Pasos de Prueba</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-custom">
                    {proof.map((step, idx) => {
                      let stepText = step.text;
                      
                      return (
                        <div key={idx} className="bg-slate-900/50 p-2 rounded border border-white/10">
                          <div className="text-xs text-slate-400 mb-1">Paso {idx + 1}</div>
                          <div className="scale-90 origin-top-left">
                            <Formula latex={stepText} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Información de DP */}
              {characteristicEquation && characteristicEquation.is_dp_linear && characteristicEquation.dp_version && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="text-green-300 font-semibold text-sm mb-2">Información de DP</h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-400">Complejidad recursiva:</span>
                      <span className="text-red-300 ml-2 font-semibold">{characteristicEquation.dp_version.recursive_complexity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Complejidad con DP:</span>
                      <span className="text-green-300 ml-2 font-semibold">{characteristicEquation.dp_version.time_complexity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Espacio con DP:</span>
                      <span className="text-green-300 ml-2 font-semibold">{characteristicEquation.dp_version.space_complexity}</span>
                    </div>
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

