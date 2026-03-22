"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { translateBackendContent } from "@/lib/backend-content-translator";

import Formula from "./Formula";
import BaseModalContainer from "./modals/BaseModalContainer";

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

    return rounded.toFixed(3).replace(/\.?0+$/, "");
  });
}

interface CharacteristicEquationModalProps {
  open: boolean;
  onClose: () => void;
  recurrence: AnalyzeOpenResponse["totals"]["recurrence"] | null | undefined;
  characteristicEquation:
    | {
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
      }
    | null
    | undefined;
  proof:
    | Array<{
        id: string;
        text: string;
      }>
    | null
    | undefined;
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
const MODAL_SIZE = "w-[min(95vw,1000px)] max-h-[75vh]";

const DP_EQUIVALENCE_ES =
  "Las raíces de la ecuación característica corresponden a los valores propios de la transición lineal del sistema DP. La solución cerrada matemática equivale a la solución iterativa mediante programación dinámica."
    .replace(/\s+/g, " ")
    .trim();

export default function CharacteristicEquationModal({
  open,
  onClose,
  recurrence,
  characteristicEquation,
  proof,
  theta,
}: Readonly<CharacteristicEquationModalProps>) {
  const t = useTranslations("analyzer.characteristicEquationModal");
  const locale = useLocale();

  if (!open) return null;

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={t("title")}
      titleIcon="calculate"
      closeAriaLabel={t("closeModal")}
      sizeClassName={MODAL_SIZE}
    >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-w-0">
            {/* Columna izquierda: Ecuación de Recurrencia y Solución */}
            <div className="space-y-4 lg:col-span-3 min-w-0">
              {/* Ecuación de Recurrencia */}
              {recurrence && (
                <div className="p-4 rounded-xl glass-card border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-lg">
                      functions
                    </span>
                    {t("recurrenceEquation")}
                  </h4>
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <div className="scale-90">
                      <Formula latex={recurrence.form} display />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1 mt-2 text-xs">
                    {recurrence.type === "linear_shift" ? (
                      recurrence["g(n)"] !== undefined &&
                      recurrence["g(n)"] !== null ? (
                        <>
                          <Formula latex={`g(n) = ${recurrence["g(n)"]}`} />
                          <span className="text-slate-300">,</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400 italic">
                            {t("gHomogeneous")}
                          </span>
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
                <div className="p-4 rounded-xl glass-card border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-lg">
                      calculate
                    </span>
                    {t("characteristicEquation")}
                  </h4>
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <div className="scale-90">
                      <Formula
                        latex={characteristicEquation.equation}
                        display
                      />
                    </div>
                  </div>

                  {/* Raíces como badges */}
                  {characteristicEquation.roots &&
                    characteristicEquation.roots.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <h5 className="text-slate-400 text-xs font-semibold mb-2">
                          {t("roots")}
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {characteristicEquation.roots.map((rootInfo, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-500/30 text-xs"
                            >
                              <span className="text-blue-300 font-semibold">
                                r{idx + 1} =
                              </span>
                              <div className="scale-90 origin-center">
                                <Formula latex={rootInfo.root} />
                              </div>
                              {rootInfo.multiplicity > 1 && (
                                <span className="text-blue-400/70 text-[10px]">
                                  (×{rootInfo.multiplicity})
                                </span>
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
                <div className="p-4 rounded-xl glass-card border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400 text-lg">
                      calculate
                    </span>
                    {t("homogeneousSolution")}
                  </h4>
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <div className="scale-90">
                      <Formula
                        latex={`T_h(n) = ${characteristicEquation.homogeneous_solution}`}
                        display
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Solución Particular */}
              {characteristicEquation &&
                characteristicEquation.particular_solution && (
                  <div className="p-4 rounded-xl glass-card border border-white/10">
                    <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-400 text-lg">
                        calculate
                      </span>
                      {t("particularSolution")}
                    </h4>
                    <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                      <div className="scale-90">
                        <Formula
                          latex={`T_p(n) = ${characteristicEquation.particular_solution}`}
                          display
                        />
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      {t("particularSolutionNote")}
                    </p>
                  </div>
                )}

              {/* Solución General */}
              {characteristicEquation &&
                (characteristicEquation.general_solution ||
                  characteristicEquation.particular_solution) && (
                  <div className="p-4 rounded-xl glass-card border border-white/10">
                    <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-400 text-lg">
                        add_circle
                      </span>
                      {t("generalSolution")}
                    </h4>
                    <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                      <div className="scale-90">
                        {characteristicEquation.general_solution ? (
                          <Formula
                            latex={`T(n) = ${characteristicEquation.general_solution}`}
                            display
                          />
                        ) : (
                          <Formula
                            latex={`T(n) = T_h(n) + T_p(n) = ${characteristicEquation.homogeneous_solution} + ${characteristicEquation.particular_solution}`}
                            display
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      {characteristicEquation.particular_solution
                        ? t("generalSolutionNote")
                        : t("generalSolutionHomogeneousNote")}
                    </p>
                  </div>
                )}

              {/* Casos Base */}
              {characteristicEquation &&
                characteristicEquation.base_cases &&
                Object.keys(characteristicEquation.base_cases).length > 0 && (
                  <div className="p-4 rounded-xl glass-card border border-white/10">
                    <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-400 text-lg">
                        check_circle
                      </span>
                      {t("baseCasesDetected")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(characteristicEquation.base_cases).map(
                        ([key, value], idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/20 border border-green-500/30 text-xs"
                          >
                            <span className="text-green-300 font-semibold">
                              {key}
                            </span>
                            <span className="text-slate-400">=</span>
                            <span className="text-white font-semibold">
                              {value}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      {t("baseCasesNote")}
                    </p>
                  </div>
                )}

              {/* Forma Cerrada */}
              {characteristicEquation && (
                <div className="p-4 rounded-xl glass-card border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-lg">
                      calculate
                    </span>
                    {t("closedForm")}
                  </h4>
                  <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                    <div className="scale-90">
                      <Formula
                        latex={`T(n) = ${characteristicEquation.closed_form}`}
                        display
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Equivalencia con DP */}
              {characteristicEquation &&
                characteristicEquation.is_dp_linear && (
                  <div className="p-4 rounded-xl glass-card bg-green-500/10 border border-green-500/30">
                    <h4 className="text-green-300 font-semibold text-sm mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">
                        memory
                      </span>
                      {t("dpEquivalence")}
                    </h4>
                    <p className="text-slate-300 text-xs">
                      {locale === "en" &&
                      characteristicEquation.dp_equivalence?.replace(/\s+/g, " ").trim() ===
                        DP_EQUIVALENCE_ES
                        ? t("dpEquivalenceDefault")
                        : characteristicEquation.dp_equivalence}
                    </p>
                  </div>
                )}
            </div>

            {/* Columna derecha: Resultado Final y Pasos */}
            <div className="space-y-4 lg:col-span-2 min-w-0">
              {/* Resultado Final */}
              <div className="p-4 rounded-xl glass-card bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400 text-lg">
                    flag
                  </span>
                  {t("finalResult")}
                </h4>
                <div className="bg-slate-900/50 p-3 rounded border border-white/10 overflow-x-auto flex justify-center">
                  <div className="scale-90">
                    <Formula
                      latex={`T(n) = ${roundLatexNumbers(theta || characteristicEquation?.theta || "N/A")}`}
                      display
                    />
                  </div>
                </div>
              </div>

              {/* Pasos de Prueba */}
              {proof && proof.length > 0 && (
                <div className="p-4 rounded-xl glass-card border border-white/10">
                  <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-400 text-lg">
                      list
                    </span>
                    {t("proofSteps")}
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-custom">
                    {proof.map((step, idx) => {
                      const stepText = translateBackendContent(
                        step.text,
                        locale === "es" ? "es" : "en"
                      );

                      return (
                        <div
                          key={idx}
                          className="bg-slate-900/50 p-2 rounded border border-white/10 min-w-0"
                        >
                          <div className="text-xs text-slate-400 mb-1">
                            {t("step")} {idx + 1}
                          </div>
                          <div className="w-full max-w-full overflow-x-auto overflow-y-hidden">
                            <Formula latex={stepText} display />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Información de DP */}
              {characteristicEquation &&
                characteristicEquation.is_dp_linear &&
                characteristicEquation.dp_version && (
                  <div className="p-4 rounded-xl glass-card bg-green-500/10 border border-green-500/30">
                    <h4 className="text-green-300 font-semibold text-sm mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">
                        memory
                      </span>
                      {t("dpInfo")}
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400">
                          {t("recursiveComplexity")}
                        </span>
                        <span className="text-red-300 ml-2 font-semibold">
                          {
                            characteristicEquation.dp_version
                              .recursive_complexity
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">
                          {t("dpComplexity")}
                        </span>
                        <span className="text-green-300 ml-2 font-semibold">
                          {characteristicEquation.dp_version.time_complexity}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">{t("dpSpace")}</span>
                        <span className="text-green-300 ml-2 font-semibold">
                          {characteristicEquation.dp_version.space_complexity}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
    </BaseModalContainer>
  );
}
