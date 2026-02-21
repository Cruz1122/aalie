"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import { useTranslations } from "next-intl";
import React, {
  useEffect,
  useMemo,
  useCallback,
  useState,
  useRef,
} from "react";

import Formula from "./Formula";

/**
 * Helper para renderizar variables con KaTeX (memoizado).
 * @param variable - Variable o expresión LaTeX a renderizar
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const RenderVariable = React.memo(({ variable }: { variable: string }) => {
  return <Formula latex={variable} />;
});
RenderVariable.displayName = "RenderVariable";

/**
 * Componente de lista virtualizada simple para pasos del procedimiento.
 * Optimiza el renderizado de listas largas de pasos usando virtualización.
 *
 * @param steps - Array de pasos del procedimiento (expresiones LaTeX)
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const VirtualizedStepsList = React.memo(({ steps }: { steps: string[] }) => {
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: Math.min(10, steps.length),
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 80; // Altura estimada por paso

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const containerHeight = e.currentTarget.clientHeight;

      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(
        steps.length,
        start + Math.ceil(containerHeight / itemHeight) + 2,
      );

      setVisibleRange({ start, end });
    },
    [steps.length, itemHeight],
  );

  const visibleSteps = steps.slice(visibleRange.start, visibleRange.end);
  const totalHeight = steps.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className="space-y-3 max-h-96 overflow-y-auto scrollbar-custom"
      onScroll={handleScroll}
      style={{
        scrollBehavior: "smooth",
        willChange: "scroll-position",
      }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleSteps.map((step, index) => (
            <div
              key={visibleRange.start + index}
              className="flex items-start gap-3 p-2"
              style={{ height: itemHeight }}
            >
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                {visibleRange.start + index + 1}
              </div>
              <div className="flex-1 min-w-0 bg-slate-900/50 p-3 rounded-lg border border-white/10 overflow-x-auto scrollbar-custom">
                <Formula latex={step} display />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
VirtualizedStepsList.displayName = "VirtualizedStepsList";

/**
 * Propiedades del componente ProcedureModal.
 */
interface ProcedureModalProps {
  /** Indica si el modal está abierto */
  open: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Número de línea seleccionada (null para procedimiento completo) */
  selectedLine?: number | null;
  /** Datos del análisis a mostrar */
  analysisData?: AnalyzeOpenResponse;
}

/**
 * Modal para mostrar el procedimiento de análisis.
 * Puede mostrar el procedimiento de una línea específica o el procedimiento completo.
 * Soporta caso promedio con virtualización para listas largas de pasos.
 *
 * @param props - Propiedades del modal
 * @returns Modal con procedimiento o null si está cerrado
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```tsx
 * <ProcedureModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   selectedLine={5}
 *   analysisData={analysisData}
 * />
 * ```
 */
export default function ProcedureModal({
  open,
  onClose,
  selectedLine,
  analysisData,
}: Readonly<ProcedureModalProps>) {
  const t = useTranslations("analyzer.procedureModal");
  const tLineTable = useTranslations("analyzer.lineTable");
  const [scrollDebounce, setScrollDebounce] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Detectar si es caso promedio
  const isAvgCase = useMemo(() => {
    return analysisData?.totals?.avg_model_info !== undefined;
  }, [analysisData?.totals?.avg_model_info]);

  // Memoizar el título del modal
  const modalTitle = useMemo(() => {
    const isLineProcedure = selectedLine !== null && selectedLine !== undefined;
    const caseType = isAvgCase ? t("avgCaseSuffix") : "";
    return isLineProcedure
      ? `${t("titleLine", { line: selectedLine })}${caseType}`
      : `${t("titleComplete")}${caseType}`;
  }, [selectedLine, isAvgCase, t]);

  /**
   * Función para extraer el patrón de un término (n+1, n, 1, etc.).
   * @param count - Expresión de conteo a analizar
   * @returns Patrón normalizado
   * @author Juan Camilo Cruz Parra (@Cruz1122)
   */
  const extractPattern = useCallback((count: string): string => {
    // Normalizar espacios y paréntesis
    const normalized = count
      .replaceAll(/\s+/g, "")
      .replaceAll("(", "")
      .replaceAll(")", "");

    // Mapeo de patrones comunes
    const patternMap: Record<string, string> = {
      "1": "1",
      n: "n",
      "n+1": "n+1",
      "1+n": "n+1",
      "n-1": "n-1",
      "-1+n": "n-1",
    };

    // Verificar patrones exactos primero
    if (patternMap[normalized]) {
      return patternMap[normalized];
    }

    // Verificar patrones que contienen subcadenas
    if (normalized.includes("n^2") || normalized.includes("n²")) return "n²";
    if (normalized.includes("n^3") || normalized.includes("n³")) return "n³";
    if (normalized.includes("log") || normalized.includes("ln"))
      return "log(n)";

    // Si contiene n pero no es un patrón conocido, devolver como está
    if (normalized.includes("n")) return normalized;

    // Constante por defecto
    return "1";
  }, []);

  // Función para agrupar términos similares
  const groupSimilarTerms = useCallback(
    (terms: Array<{ ck: string; count: string }>): string => {
      const groups: Record<string, string[]> = {};

      // Agrupar términos por patrón
      for (const term of terms) {
        const pattern = extractPattern(term.count);
        if (!groups[pattern]) {
          groups[pattern] = [];
        }
        groups[pattern].push(term.ck);
      }

      // Construir la ecuación agrupada
      const groupedTerms = Object.entries(groups).map(
        ([pattern, coefficients]) => {
          const coefficientStr =
            coefficients.length === 1
              ? coefficients[0]
              : `(${coefficients.join(" + ")})`;

          return `${coefficientStr} (${pattern})`;
        },
      );

      return groupedTerms.join(" + ");
    },
    [extractPattern],
  );

  // Función para crear la forma final más simplificada
  const createFinalSimplifiedForm = useCallback(
    (groupedEquation: string, tPolynomial?: string | null): string => {
      // Priorizar T_polynomial del backend si está disponible
      if (tPolynomial && tPolynomial.trim().length > 0) {
        return tPolynomial;
      }
      if (!groupedEquation || groupedEquation.trim() === "") {
        return "a";
      }

      const hasCubic =
        groupedEquation.includes("n^3") || groupedEquation.includes("n³");
      const hasQuadratic =
        groupedEquation.includes("n^2") || groupedEquation.includes("n²");
      const linearPattern = String.raw`(^|[^\^])n(?![\w^])`;
      const hasLinear =
        new RegExp(linearPattern).test(groupedEquation) ||
        groupedEquation.includes("n+1") ||
        groupedEquation.includes("n-1");
      const hasLog = groupedEquation.includes("log");

      const coeffs = ["a", "b", "c", "d"];
      const terms: string[] = [];

      if (hasCubic) {
        terms.push(
          `${coeffs[0]} \\cdot n^3`,
          `${coeffs[1]} \\cdot n^2`,
          `${coeffs[2]} \\cdot n`,
          `${coeffs[3]}`,
        );
        return terms.join(" + ");
      }

      if (hasQuadratic) {
        terms.push(
          `${coeffs[0]} \\cdot n^2`,
          `${coeffs[1]} \\cdot n`,
          `${coeffs[2]}`,
        );
        return terms.join(" + ");
      }

      if (hasLinear) {
        terms.push(`${coeffs[0]} \\cdot n`, `${coeffs[1]}`);
        return terms.join(" + ");
      }

      if (hasLog) {
        terms.push(`${coeffs[0]} \\cdot \\log(n)`, `${coeffs[1]}`);
        return terms.join(" + ");
      }

      return `${coeffs[0]}`; // constante
    },
    [],
  );

  // Helper para calcular Big-O
  const calculateBigOFromExpression = useCallback((expr: string): string => {
    if (expr.includes("n^3")) return "O(n^3)";
    if (expr.includes("n^2")) return "O(n^2)";
    const linearPattern = String.raw`(^|[^\^])n(?![\w^])`;
    if (new RegExp(linearPattern).test(expr)) return "O(n)";
    const logPattern = String.raw`\log(n)|log(n)`;
    if (new RegExp(logPattern).test(expr)) return String.raw`O(\log n)`;
    return "O(1)";
  }, []);

  const sanitizeProcedureStep = useCallback((step: string): string => {
    const trimmedStep = step.trim();
    const textCheckPattern = String.raw`\text\{`;

    // Si no contiene \text{}, retornar tal cual
    if (!trimmedStep.includes(textCheckPattern)) {
      return trimmedStep;
    }

    // Pattern para encontrar todos los bloques \text{...} y procesarlos individualmente
    const textBlockRegex = /\\text\{([^}]*)\}/g;
    const matches = Array.from(trimmedStep.matchAll(textBlockRegex));

    if (matches.length === 0) {
      return trimmedStep;
    }

    // Procesar cada bloque encontrado y crear un mapa de reemplazos
    const replacements = new Map<string, string>();
    for (const match of matches) {
      const originalMatch = match[0];
      if (replacements.has(originalMatch)) {
        continue; // Ya procesado
      }

      const content = match[1] ?? "";
      let normalizedContent = content.replaceAll(/\s+/g, " ").trim();

      // Normalizar dos puntos: asegurar formato ": " si hay dos puntos
      normalizedContent = normalizedContent.replaceAll(/\s*:\s*/g, ": ").trim();

      // Asegurar espacio al final dentro de las llaves (requisito de formato)
      const finalContent = normalizedContent.endsWith(" ")
        ? normalizedContent
        : `${normalizedContent} `;

      const sanitized = `\\text{${finalContent}}`;
      replacements.set(originalMatch, sanitized);
    }

    // Aplicar todos los reemplazos
    let sanitized = trimmedStep;
    for (const [original, replacement] of replacements) {
      sanitized = sanitized.replaceAll(original, replacement);
    }

    // Limpiar posibles espacios múltiples entre bloques
    const cleaned = sanitized
      .replaceAll(/\s+/g, " ") // Normalizar espacios múltiples
      .trim();

    return cleaned;
  }, []);

  // Memoizar las ecuaciones de derivación
  const derivationSteps = useMemo(() => {
    if (!analysisData?.byLine) return [];

    // Para caso promedio, usar pasos específicos
    if (isAvgCase) {
      const totals = analysisData.totals as
        | {
            avg_model_info?: { mode: string; note: string };
            hypotheses?: string[];
            A_of_n?: string;
            T_open?: string;
          }
        | undefined;

      const steps: Array<{
        title: string;
        equation: string;
        description: string;
      }> = [];

      // Paso 1: Definición de caso promedio
      steps.push({
        title: t("stepDefAvgCase"),
        equation: "A(n) = \\sum_{I \\in I_n} T(I) \\cdot p(I)",
        description: "Costo promedio como esperanza sobre todas las instancias",
      });

      // Paso 2: Modelo uniforme (si aplica)
      if (totals?.avg_model_info?.mode === "uniform") {
        steps.push({
          title: t("stepUniformModel"),
          equation: "A(n) = \\frac{1}{|I_n|} \\sum_{I \\in I_n} T(I)",
          description: "Distribución uniforme sobre todas las instancias",
        });
      }

      // Paso 3: Linealidad de la esperanza
      steps.push({
        title: t("stepLinearity"),
        equation: "A(n) = \\sum_{\\ell} C_{\\ell} \\cdot E[N_{\\ell}]",
        description: "Descomposición línea a línea usando esperanzas",
      });

      // Paso 4: Ecuación con E[N_ℓ]
      const step4 = analysisData.byLine
        .map((line) => {
          const count = line.expectedRuns || line.count;
          const opsPart = (line.ops ?? 1) > 1 ? ` \\cdot ${line.ops}` : "";
          return `${line.ck} \\cdot E[N_{${line.line}}] = ${line.ck}${opsPart} \\cdot (${count})`;
        })
        .join(" + ");
      steps.push({
        title: t("stepCalcE"),
        equation: `A(n) = ${step4}`,
        description: t("expectedExecutionsDesc"),
      });

      // Paso 5: Simplificación
      const step5 = analysisData.byLine
        .map((line) => {
          const opsPart = (line.ops ?? 1) > 1 ? ` \\cdot ${line.ops}` : "";
          return `${line.ck}${opsPart} \\cdot (${line.count})`;
        })
        .join(" + ");
      steps.push({
        title: t("stepSimplification"),
        equation: `A(n) = ${step5}`,
        description: t("stepSimplifySumsDesc"),
      });

      // Paso 6: Forma polinómica
      const tPoly = analysisData.totals?.T_polynomial;
      if (tPoly && typeof tPoly === "string") {
        steps.push({
          title: t("stepPolynomialForm"),
          equation: `A(n) = ${tPoly}`,
          description: "Forma polinómica canónica",
        });
      }

      // Paso 7: Notación asintótica
      const bigO = analysisData.totals?.big_o || "O(1)";
      const bigOmega = analysisData.totals?.big_omega || "\\Omega(1)";
      const bigTheta = analysisData.totals?.big_theta || "\\Theta(1)";
      const isUnbounded = bigO === "\\infty" || bigTheta === "\\infty";
      steps.push({
        title: t("stepAsymptotic"),
        equation: isUnbounded ? "\\infty" : `${bigO}, ${bigOmega}, ${bigTheta}`,
        description: t("stepAsymptoticDesc"),
      });

      // Paso 8: Modelo e hipótesis
      if (totals?.avg_model_info) {
        steps.push({
          title: t("stepModelUsed"),
          equation: `\\text{${t("modelLabel")} ${totals.avg_model_info.note}}`,
          description: "Modelo probabilístico utilizado",
        });
      }

      if (totals?.hypotheses && totals.hypotheses.length > 0) {
        steps.push({
          title: t("stepHypotheses"),
          equation: totals.hypotheses.map((h) => `\\text{${h}}`).join(", "),
          description: "Supuestos del análisis",
        });
      }

      return steps;
    }

    // Para worst/best case, usar pasos normales
    // Paso 1: Ecuación completa con count_raw (o count si count_raw no está disponible)
    const step1 = analysisData.byLine
      .map((line) => {
        const opsPart = (line.ops ?? 1) > 1 ? ` \\cdot ${line.ops}` : "";
        return `${line.ck}${opsPart} \\cdot (${line.count_raw ?? line.count})`;
      })
      .join(" + ");

    // Paso 2: Ecuación con count simplificado
    const step2 = analysisData.byLine
      .map((line) => {
        const opsPart = (line.ops ?? 1) > 1 ? ` \\cdot ${line.ops}` : "";
        return `${line.ck}${opsPart} \\cdot (${line.count})`;
      })
      .join(" + ");

    // Paso 3: Agrupación de términos similares (incluir ops en ck para agrupación)
    const step3 = groupSimilarTerms(
      analysisData.byLine.map((line) => ({
        ck: (line.ops ?? 1) > 1 ? `${line.ck} \\cdot ${line.ops}` : line.ck,
        count: line.count,
      })),
    );

    // Paso 4: Forma final con constantes a, b, c, etc. (usar T_polynomial si está)
    const tPoly = analysisData.totals?.T_polynomial;
    const step4 = createFinalSimplifiedForm(
      step3,
      typeof tPoly === "string" ? tPoly : undefined,
    );

    // Paso 5: Notación asintótica desde el backend (calculada con SymPy)
    const totals = analysisData?.totals as
      | {
          big_o?: string;
          big_omega?: string;
          big_theta?: string;
        }
      | undefined;

    const bigO = totals?.big_o || calculateBigOFromExpression(step4);
    const bigOmega = totals?.big_omega || "\\Omega(1)";
    const bigTheta = totals?.big_theta || "\\Theta(1)";
    const isUnbounded = bigO === "\\infty" || bigTheta === "\\infty";

    // Crear array de pasos con sus ecuaciones
    const allSteps = [
      {
        title: t("stepFullEquation"),
        equation: step1,
        description: t("stepFullEquationDesc"),
      },
      {
        title: t("stepSimplifySums"),
        equation: step2,
        description: t("stepSimplifySumsDesc"),
      },
      {
        title: t("stepGroupTerms"),
        equation: step3,
        description: t("stepGroupTermsDesc"),
      },
      {
        title: t("stepFinalForm"),
        equation: step4,
        description: t("stepFinalFormDesc"),
      },
      {
        title: t("stepAsymptotic"),
        equation: isUnbounded ? "\\infty" : `${bigO}, ${bigOmega}, ${bigTheta}`,
        description: t("stepAsymptoticDesc"),
      },
    ];

    // Filtrar pasos que son diferentes al anterior
    const filteredSteps = allSteps.filter((step, index) => {
      if (index === 0) return true; // Siempre mostrar el primer paso

      const previousStep = allSteps[index - 1];
      return step.equation !== previousStep.equation;
    });

    return filteredSteps;
  }, [
    analysisData,
    groupSimilarTerms,
    createFinalSimplifiedForm,
    calculateBigOFromExpression,
    isAvgCase,
    t,
  ]);

  // Memoizar los símbolos
  const symbols = useMemo(() => {
    return analysisData?.totals?.symbols || {};
  }, [analysisData?.totals?.symbols]);

  // Memoizar las notas
  const notes = useMemo(() => {
    return analysisData?.totals?.notes || [];
  }, [analysisData?.totals?.notes]);

  // Optimizar el manejo de scroll con debouncing
  const handleScroll = useCallback(
    (_e: React.UIEvent<HTMLDivElement>) => {
      if (scrollDebounce) {
        clearTimeout(scrollDebounce);
      }

      const timeout = setTimeout(() => {
        // Aquí podríamos agregar lógica adicional si es necesario
        setScrollDebounce(null);
      }, 16); // ~60fps

      setScrollDebounce(timeout);
    },
    [scrollDebounce],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (open) {
      // Bloquear scroll de la página
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKey);
    } else {
      // Restaurar scroll de la página
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", onKey);
      if (scrollDebounce) {
        clearTimeout(scrollDebounce);
      }
    };
  }, [open, onClose, scrollDebounce]);

  if (!open) return null;

  const isLineProcedure = selectedLine !== null && selectedLine !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 glass-modal-overlay" />
      <div className="relative z-10 w-[min(95vw,1200px)] max-h-[90vh] rounded-2xl glass-modal-container shadow-2xl flex flex-col overflow-hidden mx-4">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 flex-shrink-0 glass-modal-header">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">description</span>
            {modalTitle}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
            aria-label={t("closeModal")}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-custom"
          onScroll={handleScroll}
          style={{
            scrollBehavior: "smooth",
            willChange: "scroll-position",
          }}
        >
          {isLineProcedure ? (
            // Contenido específico para una línea
            <div className="space-y-4">
              {analysisData &&
                (() => {
                  const lineData = analysisData.byLine.find(
                    (line) => line.line === selectedLine,
                  );
                  if (!lineData) {
                    return (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-red-300">
                          {t("lineNotFound", { line: selectedLine })}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Información de la línea */}
                      <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10 space-y-4">
                        <h4 className="font-semibold text-white text-base flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-400 text-lg">insights</span>
                          {t("lineAnalysis", { line: selectedLine })}
                        </h4>

                        {/* Tipo de operación */}
                        <div>
                          <span className="text-sm font-medium text-slate-400 block mb-2">
                            {t("operationType")}
                          </span>
                          <div className="mt-1">
                            {(() => {
                              const kindConfig: Record<
                                string,
                                { labelKey: string; className: string }
                              > = {
                                assign: {
                                  labelKey: "assign",
                                  className:
                                    "bg-blue-500/20 text-blue-300 border-blue-500/30",
                                },
                                if: {
                                  labelKey: "if",
                                  className:
                                    "bg-purple-500/20 text-purple-300 border-purple-500/30",
                                },
                                for: {
                                  labelKey: "for",
                                  className:
                                    "bg-green-500/20 text-green-300 border-green-500/30",
                                },
                                while: {
                                  labelKey: "while",
                                  className:
                                    "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
                                },
                                repeat: {
                                  labelKey: "repeat",
                                  className:
                                    "bg-orange-500/20 text-orange-300 border-orange-500/30",
                                },
                                call: {
                                  labelKey: "call",
                                  className:
                                    "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                                },
                                return: {
                                  labelKey: "return",
                                  className:
                                    "bg-pink-500/20 text-pink-300 border-pink-500/30",
                                },
                                print: {
                                  labelKey: "print",
                                  className:
                                    "bg-teal-500/20 text-teal-300 border-teal-500/30",
                                },
                                decl: {
                                  labelKey: "decl",
                                  className:
                                    "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
                                },
                              };
                              const config = kindConfig[lineData.kind] || {
                                labelKey: "other",
                                className:
                                  "bg-gray-500/20 text-gray-300 border-gray-500/30",
                              };
                              return (
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}
                                >
                                  {tLineTable(config.labelKey)}
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Costo elemental */}
                        <div>
                          <span className="text-sm font-medium text-slate-400 block mb-2">
                            {t("elementalCost")}
                          </span>
                          <div className="p-3 rounded-lg bg-slate-900/50 border border-blue-500/20 overflow-x-auto scrollbar-custom">
                            <Formula latex={lineData.ck} display />
                          </div>
                          <p className="text-slate-400 mt-1.5 text-xs">
                            {t("elementalCostDesc")}
                          </p>
                        </div>

                        {/* Operaciones elementales */}
                        {lineData.ops != null && lineData.ops > 1 && (
                          <div>
                            <span className="text-sm font-medium text-slate-400 block mb-2">
                              {tLineTable("elementaryOps")}
                            </span>
                            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-600/30">
                              <span className="text-slate-200">{lineData.ops}</span>
                            </div>
                          </div>
                        )}

                        {/* Número de ejecuciones (o E[#] para promedio) */}
                        <div>
                          <span className="text-sm font-medium text-slate-400 block mb-2">
                            {isAvgCase
                              ? t("expectedExecutions")
                              : t("numExecutions")}
                          </span>
                          <div className="p-3 rounded-lg bg-slate-900/50 border border-amber-500/20 overflow-x-auto scrollbar-custom">
                            <Formula
                              latex={lineData.expectedRuns || lineData.count}
                              display
                            />
                          </div>
                          <p className="text-slate-400 mt-1.5 text-xs">
                            {isAvgCase
                              ? t("expectedExecutionsDesc")
                              : t("numExecutionsDesc")}
                          </p>
                        </div>

                        {/* Notas adicionales */}
                        {lineData.note && (
                          <div>
                            <span className="text-sm font-medium text-slate-400 block mb-2">
                              {t("notes")}
                            </span>
                            <div className="mt-2 p-3 rounded bg-slate-900/50 border border-green-500/20">
                              <p className="text-slate-300 text-sm">
                                {lineData.note}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Fórmula de costo total */}
                        <div>
                          <span className="text-sm font-medium text-slate-400 block mb-2">
                            {isAvgCase
                              ? t("lineCostAvg")
                              : t("lineCost")}
                          </span>
                          <div className="p-3 rounded-lg bg-slate-900/50 border border-purple-500/20 overflow-x-auto scrollbar-custom">
                            <Formula
                              latex={
                                (lineData.ops ?? 1) > 1
                                  ? `${lineData.ck} \\cdot ${lineData.ops} \\cdot (${lineData.expectedRuns || lineData.count})`
                                  : `${lineData.ck} \\cdot (${lineData.expectedRuns || lineData.count})`
                              }
                              display
                            />
                          </div>
                          <p className="text-slate-400 mt-1.5 text-xs">
                            {isAvgCase
                              ? t("lineCostAvgDesc")
                              : t("lineCostDesc")}
                          </p>
                        </div>
                      </div>

                      {/* Información adicional del análisis completo */}
                      <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10 space-y-4">
                        <h4 className="font-semibold text-white text-base flex items-center gap-2">
                          <span className="material-symbols-outlined text-cyan-400 text-lg">science</span>
                          {t("analysisContext")}
                        </h4>

                        {/* Ecuación principal */}
                        <div>
                          <span className="text-sm font-medium text-slate-400 block mb-2">
                            {isAvgCase
                              ? t("efficiencyEqAvg")
                              : t("efficiencyEq")}
                          </span>
                          <div className="mt-2 p-3 rounded bg-slate-900/50 border border-white/10 overflow-x-auto scrollbar-custom">
                            <Formula
                              latex={
                                analysisData.totals.A_of_n ||
                                analysisData.totals.T_open
                              }
                              display
                            />
                          </div>
                          {isAvgCase && analysisData.totals.avg_model_info && (
                            <p className="text-slate-300 mt-1 text-xs">
                              {t("modelLabel")} {analysisData.totals.avg_model_info.note}
                            </p>
                          )}
                        </div>

                        {/* Pasos del procedimiento específico de la línea */}
                        {lineData.procedure &&
                          lineData.procedure.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-slate-400 block mb-2">
                                {t("simplificationProcedure")}
                              </span>
                              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto scrollbar-custom">
                                {lineData.procedure.map((step, index) => (
                                  <div
                                    key={index}
                                    className="flex items-start gap-2 p-2 bg-slate-900/50 rounded border border-white/10"
                                  >
                                    <div className="flex-shrink-0 w-5 h-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                                      {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0 overflow-x-auto scrollbar-custom">
                                      <Formula
                                        latex={sanitizeProcedureStep(step)}
                                        display
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Símbolos */}
                        {analysisData.totals.symbols &&
                          Object.keys(analysisData.totals.symbols).length >
                            0 && (
                            <div>
                              <span className="text-sm font-medium text-slate-400 block mb-2">
                                {t("symbolsUsed")}
                              </span>
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto scrollbar-custom">
                                {Object.entries(
                                  analysisData.totals.symbols,
                                ).map(([symbol, description]) => (
                                  <div
                                    key={symbol}
                                    className="flex items-center gap-2 p-2 bg-slate-900/50 rounded border border-white/10"
                                  >
                                    <div className="flex-shrink-0">
                                      <Formula latex={symbol} />
                                    </div>
                                    <span className="text-slate-300 text-xs">
                                      = {description}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Notas generales */}
                        {analysisData.totals.notes &&
                          analysisData.totals.notes.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-slate-400 block mb-2">
                                {t("generalNotes")}
                              </span>
                              <ul className="mt-2 space-y-1 max-h-24 overflow-y-auto scrollbar-custom">
                                {analysisData.totals.notes.map(
                                  (note, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2 text-sm text-slate-300"
                                    >
                                      <span className="text-amber-400 mt-1 flex-shrink-0">
                                        •
                                      </span>
                                      <span>{note}</span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })()}
            </div>
          ) : (
            // Contenido general (análisis completo)
            <>
              {analysisData && (
                <div className="space-y-4">
                  {/* Ecuación principal */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-cyan-400">functions</span>
                      {isAvgCase
                        ? t("efficiencyEquationAvg")
                        : t("efficiencyEquation")}
                    </h4>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10 overflow-x-auto scrollbar-custom">
                      <Formula
                        latex={
                          analysisData.totals.A_of_n ||
                          analysisData.totals.T_open
                        }
                        display
                      />
                    </div>
                    {isAvgCase && analysisData.totals.avg_model_info && (
                      <p className="text-slate-300 mt-2 text-sm">
                        {t("modelLabel")} {analysisData.totals.avg_model_info.note}
                      </p>
                    )}
                  </div>

                  {/* Forma polinómica T(n) o A(n) si está disponible */}
                  {analysisData.totals.T_polynomial && (
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-400">calculate</span>
                        {isAvgCase
                          ? t("polynomialFormAvg")
                          : t("polynomialForm")}
                      </h4>
                      <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10 overflow-x-auto scrollbar-custom">
                        <Formula
                          latex={
                            analysisData.totals
                              .T_polynomial as unknown as string
                          }
                          display
                        />
                      </div>
                    </div>
                  )}

                  {/* Notación asintótica derivada de T(n) o de la forma detectada */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-400">trending_up</span>
                      {t("asymptoticNotation")}
                    </h4>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10 overflow-x-auto scrollbar-custom">
                      {(() => {
                        const tPoly = analysisData.totals?.T_polynomial;
                        const base =
                          typeof tPoly === "string" && tPoly.trim().length > 0
                            ? tPoly
                            : derivationSteps[3]?.equation || "";
                        const bigO = calculateBigOFromExpression(base);
                        return <Formula latex={bigO} display />;
                      })()}
                    </div>
                  </div>

                  {/* Pasos de derivación de la ecuación */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-400">account_tree</span>
                      {isAvgCase
                        ? t("derivationA")
                        : t("derivationT")}
                    </h4>
                    <div className="space-y-4">
                      {derivationSteps.map((step, index) => {
                        const colors = [
                          {
                            bg: "bg-blue-500/20",
                            text: "text-blue-300",
                            border: "border-blue-500/20",
                          },
                          {
                            bg: "bg-green-500/20",
                            text: "text-green-300",
                            border: "border-green-500/20",
                          },
                          {
                            bg: "bg-yellow-500/20",
                            text: "text-yellow-300",
                            border: "border-yellow-500/20",
                          },
                          {
                            bg: "bg-purple-500/20",
                            text: "text-purple-300",
                            border: "border-purple-500/20",
                          },
                        ];
                        const color = colors[index] || colors[0];

                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 ${color.bg} ${color.text} rounded-full flex items-center justify-center text-xs font-medium`}
                              >
                                {index + 1}
                              </div>
                              <h5 className="text-sm font-medium text-slate-300">
                                {step.title}:
                              </h5>
                            </div>
                            <div
                              className={`ml-8 p-3 bg-slate-900/50 rounded-lg border ${color.border} overflow-x-auto scrollbar-custom`}
                            >
                              <Formula latex={step.equation} display />
                            </div>
                            <p className="text-xs text-slate-400 ml-8">
                              {step.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Símbolos */}
                  {Object.keys(symbols).length > 0 && (
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400">abc</span>
                        {t("symbols")}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-custom">
                        {Object.entries(symbols).map(
                          ([symbol, description]) => (
                            <div
                              key={symbol}
                              className="flex items-center gap-2 p-2 bg-slate-900/50 rounded border border-white/10"
                            >
                              <div className="flex-shrink-0">
                                <RenderVariable variable={symbol} />
                              </div>
                              <span className="text-slate-300 text-xs">
                                = {description}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  {notes.length > 0 && (
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-400">note</span>
                        {t("generalNotes")}
                      </h4>
                      <ul className="space-y-2 max-h-32 overflow-y-auto scrollbar-custom">
                        {notes.map((note, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-slate-300"
                          >
                            <span className="text-amber-400 mt-1 flex-shrink-0">
                              •
                            </span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
