"use client";

/**
 * Modal para mostrar el procedimiento general de análisis.
 * Muestra la ecuación de eficiencia T(n) o A(n), forma polinómica,
 * notaciones asintóticas y pasos del procedimiento.
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
import type { AnalyzeOpenResponse } from "@aa/types";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo } from "react";

import Formula from "./Formula";

/**
 * Propiedades del componente GeneralProcedureModal.
 */
interface GeneralProcedureModalProps {
  /** Indica si el modal está abierto */
  open: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Datos del análisis a mostrar */
  data: AnalyzeOpenResponse | undefined;
}

/**
 * Normaliza una expresión polinómica removiendo términos con "0 *".
 * @param poly - Expresión polinómica a normalizar
 * @returns Expresión polinómica normalizada
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const normalizePolynomial = (poly?: string): string => {
  if (!poly) return "";
  // Reemplazar \\cdot por espacio y limpiar espacios
  const p = poly
    .replace(/\\cdot/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Separar por + y filtrar términos con "0 *"
  const parts = p
    .split("+")
    .map((s) => s.trim())
    .filter((term) => !/^0\s/.test(term));
  // Volver a unir respetando espacios alrededor de +
  return parts.join(" + ") || "0";
};

/**
 * Deriva la notación Big-O a partir de una expresión base.
 * @param base - Expresión base para derivar Big-O
 * @returns Notación Big-O en formato LaTeX
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const deriveBigO = (base: string): string => {
  if (!base) return "O(1)";
  if (base.includes("n^3") || base.includes("n³")) return "O(n^3)";
  if (base.includes("n^2") || base.includes("n²")) return "O(n^2)";
  if (/([^\^]|^)n(?![\w^])/.test(base)) return "O(n)";
  if (base.includes("\\log(n)")) return "O(\\log n)";
  return "O(1)";
};

/**
 * Componente modal para mostrar el procedimiento general de análisis.
 *
 * @param props - Propiedades del modal
 * @returns Modal con procedimiento general o null si está cerrado
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```tsx
 * <GeneralProcedureModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   data={analysisData}
 * />
 * ```
 */
export default function GeneralProcedureModal({
  open,
  onClose,
  data,
}: Readonly<GeneralProcedureModalProps>) {
  const t = useTranslations("analyzer.generalProcedureModal");

  // Detectar si es caso promedio
  const isAvgCase = data?.totals?.avg_model_info !== undefined;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKey);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const tOpen = data?.totals?.A_of_n || data?.totals?.T_open || "";
  const rawPoly = (data?.totals as { T_polynomial?: string })?.T_polynomial;
  const normPoly = normalizePolynomial(rawPoly);

  // Usar notaciones asintóticas del backend (calculadas con SymPy) si están disponibles
  const totals = data?.totals as
    | {
        T_polynomial?: string;
        big_o?: string;
        big_omega?: string;
        big_theta?: string;
        avg_model_info?: { mode: string; note: string };
        hypotheses?: string[];
        notes?: string[];
        procedure?: string[]; // Pasos del procedimiento (para caso promedio)
      }
    | undefined;

  const bigO =
    totals?.big_o ||
    deriveBigO(normPoly && normPoly !== "0" ? normPoly : tOpen);
  const bigOmega = totals?.big_omega || "\\Omega(1)";
  const bigTheta = totals?.big_theta || "\\Theta(1)";

  const grouped = useMemo(() => {
    if (!data?.byLine) return "";
    // Para caso promedio, usar expectedRuns si está disponible
    return data.byLine
      .map((line) => {
        const count = line.expectedRuns || line.count;
        const opsPart = (line.ops ?? 1) > 1 ? ` \\cdot ${line.ops}` : "";
        return `${line.ck}${opsPart} \\cdot (${count})`;
      })
      .join(" + ");
  }, [data?.byLine]);

  // Obtener pasos del procedimiento para caso promedio desde procedure
  const avgProcedureSteps = useMemo(() => {
    if (!isAvgCase || !totals?.procedure) return [];
    // Los pasos del procedimiento para promedio están en totals.procedure
    return totals.procedure;
  }, [isAvgCase, totals?.procedure]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 glass-modal-overlay"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-[min(95vw,1000px)] max-h-[90vh] rounded-2xl glass-modal-container shadow-2xl flex flex-col overflow-hidden mx-4">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 flex-shrink-0 glass-modal-header">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">
              science
            </span>
            {t("title")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
            aria-label={t("closeModal")}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-custom">
          {/* T_open o A(n) */}
          <div className="p-4 rounded-xl glass-card border border-white/10 space-y-3">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-lg">
                functions
              </span>
              {isAvgCase ? t("efficiencyEqA") : t("efficiencyEqT")}
            </h4>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10 overflow-x-auto scrollbar-custom">
              <Formula latex={tOpen} display />
            </div>
            {isAvgCase && totals?.avg_model_info && (
              <p className="text-slate-300 text-sm flex items-center gap-2">
                <span className="text-slate-400">{t("modelLabel")}</span>
                {totals.avg_model_info.note}
              </p>
            )}
          </div>

          {/* Forma polinómica */}
          <div className="p-4 rounded-xl glass-card border border-white/10 space-y-3">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400 text-lg">
                calculate
              </span>
              {isAvgCase ? t("polynomialFormA") : t("polynomialFormT")}
            </h4>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10 overflow-x-auto scrollbar-custom">
              <Formula
                latex={normPoly && normPoly !== "0" ? normPoly : grouped}
                display
              />
            </div>
          </div>

          {/* Pasos del procedimiento para caso promedio */}
          {isAvgCase && avgProcedureSteps.length > 0 && (
            <div className="p-4 rounded-xl glass-card border border-white/10 space-y-4">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400 text-lg">
                  list_alt
                </span>
                {t("avgProcedure")}
              </h4>
              <div className="space-y-3">
                {avgProcedureSteps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-white/10"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0 overflow-x-auto scrollbar-custom">
                      <Formula latex={step} display />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notación asintótica */}
          <div className="p-4 rounded-xl glass-card border border-white/10 space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-lg">
                trending_up
              </span>
              {t("asymptoticNotation")}
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-slate-900/50 rounded-lg border border-white/10 overflow-x-auto">
                <div className="text-sm text-slate-400 mb-1.5">
                  {t("bigOUpper")}
                </div>
                <Formula latex={bigO} display />
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-white/10 overflow-x-auto">
                <div className="text-sm text-slate-400 mb-1.5">
                  {t("bigOmegaLower")}
                </div>
                <Formula latex={bigOmega} display />
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-white/10 overflow-x-auto">
                <div className="text-sm text-slate-400 mb-1.5">
                  {t("bigThetaTight")}
                </div>
                <Formula latex={bigTheta} display />
              </div>
            </div>
            {isAvgCase &&
              totals?.hypotheses &&
              totals.hypotheses.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="text-sm text-yellow-300 font-semibold mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">
                      info
                    </span>
                    {t("hypotheses")}
                  </div>
                  <ul className="text-sm text-yellow-200 space-y-1.5">
                    {totals.hypotheses.map((hyp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{hyp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
