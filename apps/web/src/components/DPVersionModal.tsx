"use client";

import { useLocale, useTranslations } from "next-intl";
import React, { useEffect } from "react";

import { translatePseudocode } from "@/lib/pseudocode-translator";

import Formula from "./Formula";

interface DPVersionModalProps {
  open: boolean;
  onClose: () => void;
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
        closed_form: string;
        dp_version?: {
          code: string;
          time_complexity: string;
          space_complexity: string;
          recursive_complexity: string;
        };
        dp_equivalence: string;
        theta: string;
      }
    | null
    | undefined;
}

const MODAL_SIZE = "w-[min(95vw,1000px)] max-h-[75vh]";

const DP_EQUIVALENCE_ES =
  "Las raíces de la ecuación característica corresponden a los valores propios de la transición lineal del sistema DP. La solución cerrada matemática equivale a la solución iterativa mediante programación dinámica."
    .replace(/\s+/g, " ")
    .trim();

export default function DPVersionModal({
  open,
  onClose,
  characteristicEquation,
}: Readonly<DPVersionModalProps>) {
  const t = useTranslations("analyzer.dpVersionModal");
  const locale = useLocale() as "en" | "es";

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

  if (!open || !characteristicEquation?.dp_version) return null;

  const dpVersion = characteristicEquation.dp_version;
  const localeCode = locale === "es" ? "es" : "en";
  const translatedCode = translatePseudocode(dpVersion.code, localeCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 glass-modal-overlay"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative z-10 ${MODAL_SIZE} rounded-2xl glass-modal-container shadow-2xl flex flex-col overflow-hidden mx-4`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 flex-shrink-0 glass-modal-header">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400">
              memory
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
        <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
          <div className="space-y-4">
            {/* Comparación de Complejidades */}
            <div className="p-4 rounded-xl glass-card border border-white/10">
              <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-lg">
                  compare_arrows
                </span>
                {t("complexityComparison")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="text-red-300 font-semibold text-xs mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">call_split</span>
                    {t("recursiveVersion")}
                  </div>
                  <div className="text-red-200 mb-2 flex justify-center">
                    <Formula latex={dpVersion.recursive_complexity} display />
                  </div>
                  <div className="text-slate-400 text-xs mt-1">
                    {t("exponentialComplexity")}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="text-green-300 font-semibold text-xs mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">memory</span>
                    {t("dpVersion")}
                  </div>
                  <div className="text-green-200 mb-2 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">{t("time")}</span>
                      <Formula latex={dpVersion.time_complexity} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">{t("space")}</span>
                      <Formula latex={dpVersion.space_complexity} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Código Pseudocódigo */}
            <div className="p-4 rounded-xl glass-card border border-white/10">
              <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-lg">
                  code
                </span>
                {t("pseudocodeTitle")}
              </h4>
              <div className="bg-slate-900/80 p-3 rounded border border-white/10">
                <pre className="text-slate-200 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {translatedCode}
                </pre>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong className="text-blue-300">{t("mainChanges")}</strong>{" "}
                  {t("mainChangesText")}
                </p>
              </div>
            </div>

            {/* Explicación de Equivalencia */}
            <div className="p-4 rounded-xl glass-card bg-blue-500/10 border border-blue-500/30">
              <h4 className="text-blue-300 font-semibold mb-2 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">functions</span>
                {t("mathEquivalence")}
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                {localeCode === "en" &&
                characteristicEquation.dp_equivalence?.replace(/\s+/g, " ").trim() ===
                  DP_EQUIVALENCE_ES
                  ? t("dpEquivalenceDefault")
                  : characteristicEquation.dp_equivalence}
              </p>
            </div>

            {/* Ventajas de DP */}
            <div className="p-4 rounded-xl glass-card bg-green-500/10 border border-green-500/30">
              <h4 className="text-green-300 font-semibold mb-2 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                {t("dpAdvantages")}
              </h4>
              <ul className="space-y-1.5 text-slate-300 text-xs">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-400 text-sm">
                    check_circle
                  </span>
                  <span>
                    {t("improvedTime", {
                      recursive: dpVersion.recursive_complexity,
                      dp: dpVersion.time_complexity,
                    })}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-400 text-sm">
                    check_circle
                  </span>
                  <span>{t("noRecalc")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-400 text-sm">
                    check_circle
                  </span>
                  <span>{t("bottomUp")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-400 text-sm">
                    check_circle
                  </span>
                  <span>
                    {t("spaceOpt", {
                      space:
                        dpVersion.space_complexity === "O(n)"
                          ? "O(1)"
                          : dpVersion.space_complexity,
                    })}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
