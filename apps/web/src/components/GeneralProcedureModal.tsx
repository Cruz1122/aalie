"use client";

/**
 * Modal para mostrar el procedimiento general de análisis.
 * Muestra la ecuación de eficiencia T(n) o A(n), forma polinómica,
 * notaciones asintóticas y pasos del procedimiento.
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
import type { AnalyzeOpenResponse } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import React, { useMemo } from "react";

import Formula from "./Formula";
import BaseModalContainer from "./modals/BaseModalContainer";

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
  /** Caso seleccionado para el procedimiento general */
  caseType?: "worst" | "best" | "average";
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
  caseType = "worst",
}: Readonly<GeneralProcedureModalProps>) {
  const t = useTranslations("analyzer.generalProcedureModal");
  const locale = useLocale();

  // Detectar si es caso promedio
  const isAvgCase = data?.totals?.avg_model_info !== undefined;
  const isAverageSelected = caseType === "average";

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
        avg_foundation?: "well_founded" | "approximate";
        hypotheses?: string[];
        notes?: string[];
        procedure?: string[]; // Pasos del procedimiento general
      }
    | undefined;

  const tCases = useTranslations("analyzer.cases");
  const avgFoundation = totals?.avg_foundation;
  const isApproximate = avgFoundation === "approximate";

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

  // Obtener pasos del procedimiento general desde totals.procedure
  const procedureSteps = useMemo(() => {
    if (!totals?.procedure) return [];
    return totals.procedure;
  }, [totals?.procedure]);

  // Ajustar etiqueta del caso mostrado cuando backend devuelve same_as_worst
  const caseAwareProcedureSteps = useMemo(() => {
    if (procedureSteps.length === 0) return procedureSteps;

    const isSpanish = locale?.toLowerCase().startsWith("es");
    const caseLabel = isSpanish
      ? caseType === "best"
        ? "mejor caso"
        : caseType === "average"
          ? "caso promedio"
          : "peor caso"
      : caseType === "best"
        ? "best case"
        : caseType === "average"
          ? "average case"
          : "worst case";

    const casePattern = /(peor caso|mejor caso|caso promedio|worst case|best case|average case)/gi;
    return procedureSteps.map((step) => {
      if (typeof step !== "string") return step;
      return step.replace(casePattern, caseLabel);
    });
  }, [procedureSteps, caseType, locale]);

  if (!open) return null;

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={t("title")}
      titleIcon="science"
      closeAriaLabel={t("closeModal")}
      sizeClassName="w-[min(95vw,1000px)] max-h-[90vh]"
      contentClassName="space-y-6"
    >
      {/* Narrativa caso promedio (solo cuando isAvgCase) */}
      {isAvgCase && (
        <div className="p-4 rounded-xl glass-card border border-yellow-500/20 bg-yellow-500/5 space-y-3">
          <div className="text-slate-200 text-sm space-y-2">
            <p>{t("averageCaseExplanation")}</p>
            <p className="text-slate-300">{t("whatIsAveraged")}</p>
          </div>
          {isApproximate && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span className="material-symbols-outlined text-amber-400 text-lg shrink-0 mt-0.5">
                warning
              </span>
              <p className="text-amber-200 text-sm">
                {t("approximateWarning")}
              </p>
            </div>
          )}
        </div>
      )}

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
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-slate-300 text-sm flex items-center gap-2">
              <span className="text-slate-400">{t("modelLabel")}</span>
              {totals.avg_model_info.note}
            </p>
            {avgFoundation && (
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                  isApproximate
                    ? "bg-amber-500/20 text-amber-200 border border-amber-500/30"
                    : "bg-green-500/20 text-green-200 border border-green-500/30"
                }`}
              >
                {isApproximate
                  ? tCases("foundationApproximate")
                  : tCases("foundationWellFounded")}
              </span>
            )}
          </div>
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

      {/* Pasos del procedimiento general */}
      {procedureSteps.length > 0 && (
        <div className="p-4 rounded-xl glass-card border border-white/10 space-y-4">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400 text-lg">
              list_alt
            </span>
            {isAvgCase || isAverageSelected
              ? t("avgProcedure")
              : t("iterativeProcedure")}
          </h4>
          <div className="space-y-3">
            {caseAwareProcedureSteps.map((step, index) => (
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-sm">
            <tbody className="divide-y divide-white/10">
              <tr className="border-b border-white/10">
                <td className="py-3 pr-4 text-slate-400 w-48 shrink-0 align-top">
                  {t("bigOUpper")}
                </td>
                <td className="py-3 overflow-x-auto">
                  <Formula latex={bigO} display />
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 pr-4 text-slate-400 w-48 shrink-0 align-top">
                  {t("bigOmegaLower")}
                </td>
                <td className="py-3 overflow-x-auto">
                  <Formula latex={bigOmega} display />
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-400 w-48 shrink-0 align-top">
                  {t("bigThetaTight")}
                </td>
                <td className="py-3 overflow-x-auto">
                  <Formula latex={bigTheta} display />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {isAvgCase && totals?.hypotheses && totals.hypotheses.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="text-sm text-yellow-300 font-semibold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">info</span>
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
        {/* Mini-notas: cuándo el caso promedio es representativo */}
        {isAvgCase && (
          <div className="mt-4 p-4 bg-slate-800/50 border border-white/10 rounded-lg space-y-2">
            <div className="text-sm text-slate-300 font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-blue-400">
                lightbulb
              </span>
              {t("assumptions")}
            </div>
            <p className="text-sm text-slate-400">{t("whenRepresentative")}</p>
            <p className="text-sm text-slate-400">
              {t("whenNotRepresentative")}
            </p>
          </div>
        )}
      </div>
    </BaseModalContainer>
  );
}
