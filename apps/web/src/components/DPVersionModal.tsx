"use client";

import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { translateBackendContent } from "@/lib/backend-content-translator";
import { translatePseudocode } from "@/lib/pseudocode-translator";

import Formula from "./Formula";
import BaseModalContainer from "./modals/BaseModalContainer";

type ComplexityKind =
  | "constant"
  | "logarithmic"
  | "sublinear"
  | "linear"
  | "linearithmic"
  | "quadratic"
  | "cubic"
  | "polynomial"
  | "exponential"
  | "factorial"
  | "unknown";

type DPApplicabilityLevel = "clear" | "doubtful";
type DPPatternKind = "table" | "memoization" | "rolling_window";

function mapBackendPatternToUI(
  pattern: "tabulation" | "memoization" | "rolling_window",
): DPPatternKind {
  if (pattern === "tabulation") return "table";
  if (pattern === "memoization") return "memoization";
  return "rolling_window";
}

function inferComplexityKind(complexity: string): ComplexityKind {
  const normalized = complexity.toLowerCase().replace(/\s+/g, "");

  if (/^[oθ]\(1\)$/.test(normalized)) return "constant";
  if (normalized.includes("n!")) return "factorial";
  if (/\^n\)?$/.test(normalized) || /\([0-9.]+\^n\)/.test(normalized)) {
    return "exponential";
  }
  if (normalized.includes("nlogn") || normalized.includes("n*log") || normalized.includes("n\log")) {
    return "linearithmic";
  }
  if (normalized.includes("log(n)") || normalized.includes("logn")) {
    return "logarithmic";
  }
  if (normalized.includes("sqrt(n)") || /n\^0\.[0-9]+/.test(normalized)) {
    return "sublinear";
  }
  if (/^[oθ]\(n\)$/.test(normalized)) return "linear";
  if (/n\^2/.test(normalized)) return "quadratic";
  if (/n\^3/.test(normalized)) return "cubic";
  if (/n\^\d+/.test(normalized)) return "polynomial";

  return "unknown";
}

function inferDPApplicabilityLevel(
  backendStatus: "clear" | "doubtful" | "rejected" | undefined,
  recursiveComplexity: string,
  dpTimeComplexity: string,
): DPApplicabilityLevel {
  if (backendStatus === "clear" || backendStatus === "doubtful") {
    return backendStatus;
  }

  const recursive = recursiveComplexity.toLowerCase();
  const dpTime = dpTimeComplexity.toLowerCase();
  const hasImprovement = recursiveComplexity.trim() !== dpTimeComplexity.trim();
  const exponentialLike =
    recursive.includes("^n") ||
    recursive.includes("2^n") ||
    recursive.includes("n!") ||
    recursive.includes("phi^n") ||
    recursive.includes("φ^");

  if (hasImprovement && exponentialLike && dpTime.includes("o(n)")) {
    return "clear";
  }

  return "doubtful";
}

function inferDPPatternKind(
  backendPattern: "tabulation" | "memoization" | "rolling_window" | "none" | undefined,
  code: string,
  optimizedSpaceComplexity?: string,
): DPPatternKind {
  if (backendPattern === "tabulation") return "table";
  if (backendPattern === "memoization") return "memoization";
  if (backendPattern === "rolling_window") return "rolling_window";

  const normalized = code.toLowerCase();
  if (normalized.includes("memo") || normalized.includes("cache")) {
    return "memoization";
  }
  if ((optimizedSpaceComplexity ?? "").trim() === "O(1)") {
    return "rolling_window";
  }
  return "table";
}

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
        dp_validation?: {
          status: "clear" | "doubtful" | "rejected";
          applicable: boolean;
          confidence: "high" | "medium" | "low";
          primary_pattern: "tabulation" | "memoization" | "rolling_window" | "none";
          supported_patterns: Array<"tabulation" | "memoization" | "rolling_window">;
          reasons: string[];
        };
        dp_version?: {
          code: string;
          time_complexity: string;
          space_complexity: string;
          recursive_complexity: string;
          pattern?: "tabulation" | "memoization" | "rolling_window";
        };
        dp_optimized_version?: {
          code: string;
          time_complexity: string;
          space_complexity: string;
          pattern?: "tabulation" | "memoization" | "rolling_window";
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

  if (!open || !characteristicEquation?.dp_version) return null;

  const dpVersion = characteristicEquation.dp_version;
  const localeCode = locale === "es" ? "es" : "en";
  const translatedCode = translatePseudocode(dpVersion.code, localeCode);
  const recursiveComplexity = dpVersion.recursive_complexity.trim();
  const dpTimeComplexity = dpVersion.time_complexity.trim();
  const hasTimeImprovement = recursiveComplexity !== dpTimeComplexity;
  const recursiveComplexityKind = inferComplexityKind(recursiveComplexity);
  const dpApplicability = inferDPApplicabilityLevel(
    characteristicEquation.dp_validation?.status,
    recursiveComplexity,
    dpTimeComplexity,
  );
  const dpPattern = inferDPPatternKind(
    characteristicEquation.dp_validation?.primary_pattern ?? dpVersion.pattern,
    dpVersion.code,
    characteristicEquation.dp_optimized_version?.space_complexity,
  );
  const alternativePatterns =
    characteristicEquation.dp_validation?.supported_patterns
      ?.filter((pattern) => pattern !== characteristicEquation.dp_validation?.primary_pattern)
      .map(mapBackendPatternToUI) ?? [];

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={t("title")}
      titleIcon="memory"
      closeAriaLabel={t("closeModal")}
      sizeClassName={MODAL_SIZE}
    >
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border ${dpApplicability === "clear" ? "bg-green-500/10 border-green-500/30" : "bg-amber-500/10 border-amber-500/30"}`}
            >
              <h4 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-lg ${dpApplicability === "clear" ? "text-green-400" : "text-amber-400"}`}
                >
                  {dpApplicability === "clear" ? "check_circle" : "help"}
                </span>
                {t("applicabilityTitle")}
              </h4>
              <p className="text-slate-200 text-xs">
                {dpApplicability === "clear"
                  ? t("applicability.clear")
                  : t("applicability.doubtful")}
              </p>
              <p className="text-slate-300 text-xs mt-2">
                {t("patternUsed", { pattern: t(`patternType.${dpPattern}`) })}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {t(`patternExplanation.${dpPattern}`)}
              </p>
              {alternativePatterns.length > 0 && (
                <div className="mt-3">
                  <p className="text-slate-400 text-[11px] mb-1">{t("supportedPatterns")}</p>
                  <div className="flex flex-wrap gap-2">
                    {alternativePatterns.map((pattern) => (
                      <span
                        key={pattern}
                        className="inline-flex items-center rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[11px] text-slate-200"
                      >
                        {t(`patternType.${pattern}`)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {characteristicEquation.dp_validation?.reasons?.[0] && (
                <p className="text-slate-300 text-xs mt-2">
                  {translateBackendContent(
                    characteristicEquation.dp_validation.reasons[0],
                    locale as "en" | "es",
                  )}
                </p>
              )}
              {dpApplicability === "doubtful" && (
                <p className="text-amber-200 text-xs mt-2">{t("doubtfulDisclaimer")}</p>
              )}
            </div>

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
                    {t("recursiveComplexityDetected", {
                      type: t(`complexityType.${recursiveComplexityKind}`),
                    })}
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
                    {hasTimeImprovement
                      ? t("improvedTime", {
                          recursive: recursiveComplexity,
                          dp: dpTimeComplexity,
                        })
                      : t("sameTime", {
                          complexity: dpTimeComplexity,
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
    </BaseModalContainer>
  );
}
