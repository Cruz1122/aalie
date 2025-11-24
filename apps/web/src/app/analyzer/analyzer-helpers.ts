/**
 * Funciones helper para reducir la complejidad cognitiva del componente AnalyzerPage.
 * @author Refactored for code quality
 */

import type { AnalyzeOpenResponse, ParseResponse } from "@aa/types";
import type React from "react";

import type { MethodType } from "@/components/MethodSelector";

export interface AnalysisError {
  message: string;
  line?: number;
  column?: number;
}

/**
 * Extrae el mensaje de error de una respuesta de parseo.
 */
export function extractParseError(parseRes: ParseResponse): string {
  if (!parseRes.errors) {
    return "Error al parsear el código";
  }
  return parseRes.errors
    .map((e) => `Línea ${e.line || "?"}:${e.column || "?"} ${e.message}`)
    .join("\n");
}

/**
 * Extrae el mensaje de error de una respuesta de análisis.
 */
export function extractAnalysisError(analyzeRes: {
  errors?: AnalysisError[];
}): string {
  if (!analyzeRes.errors) {
    return "Error al analizar el algoritmo";
  }
  return analyzeRes.errors
    .map((e) => e.message || `Error en línea ${e.line || "?"}`)
    .join("\n");
}

/**
 * Maneja errores de análisis estableciendo estados de error.
 */
export function handleAnalysisError(
  errorMsg: string,
  setAnalyzing: (value: boolean) => void,
  setAnalysisProgress: (value: number) => void,
  setAnalysisMessage: (value: string) => void,
  setAlgorithmType: (
    value: "iterative" | "recursive" | "hybrid" | "unknown" | undefined,
  ) => void,
  setIsAnalysisComplete: (value: boolean) => void,
  setAnalysisError: (value: string | null) => void,
): void {
  setAnalysisError(errorMsg);
  setTimeout(() => {
    setAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisMessage("Iniciando análisis...");
    setAlgorithmType(undefined);
    setIsAnalysisComplete(false);
    setAnalysisError(null);
  }, 3000);
}

/**
 * Detecta y selecciona el método de análisis para algoritmos recursivos.
 */
export async function detectAndSelectMethod(
  source: string,
  kind: string,
  progressBeforeMethodSelection: number,
  setAnalysisMessage: (value: string) => void,
  setAnalysisProgress: React.Dispatch<React.SetStateAction<number>>,
  setApplicableMethods: (methods: MethodType[]) => void,
  setDefaultMethod: (method: MethodType) => void,
  setShowMethodSelector: (show: boolean) => void,
  minProgressRef: React.MutableRefObject<number>,
  methodSelectionPromiseRef: React.MutableRefObject<{
    resolve: (method: MethodType) => void;
    reject: () => void;
  } | null>,
  animateProgress: <T = unknown>(
    from: number,
    to: number,
    duration: number,
    setProgress: React.Dispatch<React.SetStateAction<number>>,
    promise?: Promise<T>,
  ) => Promise<T | void>,
): Promise<MethodType> {
  try {
    const detectMethodsResponse = await fetch("/api/analyze/detect-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        algorithm_kind: kind,
      }),
    });

    const detectMethodsResult = (await detectMethodsResponse.json()) as {
      ok: boolean;
      applicable_methods?: MethodType[];
      default_method?: MethodType;
      errors?: Array<{ message: string }>;
    };

    if (detectMethodsResult.ok && detectMethodsResult.applicable_methods) {
      const methods = detectMethodsResult.applicable_methods;
      const defaultMethodValue = (detectMethodsResult.default_method ||
        "master") as MethodType;

      setApplicableMethods(methods);
      setDefaultMethod(defaultMethodValue);

      if (methods.length > 1) {
        // Múltiples métodos: mostrar selector
        setAnalysisMessage("Selecciona el método de análisis...");
        minProgressRef.current = progressBeforeMethodSelection;
        setAnalysisProgress((prev) =>
          Math.max(prev, progressBeforeMethodSelection),
        );
        setShowMethodSelector(true);

        await new Promise((resolve) => setTimeout(resolve, 200));

        const selectedMethod = await new Promise<MethodType>(
          (resolve, reject) => {
            methodSelectionPromiseRef.current = { resolve, reject };
            setTimeout(() => {
              if (methodSelectionPromiseRef.current) {
                methodSelectionPromiseRef.current.resolve(defaultMethodValue);
                methodSelectionPromiseRef.current = null;
              }
            }, 60000);
          },
        ).catch(() => defaultMethodValue);

        setShowMethodSelector(false);
        methodSelectionPromiseRef.current = null;
        minProgressRef.current = 0;
        setAnalysisMessage("Método seleccionado, continuando análisis...");
        await animateProgress(
          progressBeforeMethodSelection,
          90,
          400,
          setAnalysisProgress,
        );
        return selectedMethod;
      } else {
        // Un solo método disponible
        setAnalysisMessage("Iniciando análisis de complejidad...");
        await animateProgress(
          progressBeforeMethodSelection,
          90,
          400,
          setAnalysisProgress,
        );
        return defaultMethodValue;
      }
    } else {
      // Fallo en detección: usar método por defecto
      setAnalysisMessage("Iniciando análisis de complejidad...");
      await animateProgress(
        progressBeforeMethodSelection,
        90,
        400,
        setAnalysisProgress,
      );
      return "master";
    }
  } catch (error) {
    console.warn("Error detectando métodos, usando método por defecto:", error);
    setAnalysisMessage("Iniciando análisis de complejidad...");
    await animateProgress(
      progressBeforeMethodSelection,
      90,
      400,
      setAnalysisProgress,
    );
    return "master";
  }
}

/**
 * Detecta el método usado en el análisis recursivo.
 */
export function detectRecursiveMethod(
  worst: AnalyzeOpenResponse | null | undefined,
  best: AnalyzeOpenResponse | null | undefined,
): string {
  const method =
    worst?.totals?.recurrence?.method || best?.totals?.recurrence?.method;

  if (method === "characteristic_equation") {
    return "Ecuación Característica";
  } else if (method === "iteration") {
    return "Método de Iteración";
  } else if (method === "recursion_tree") {
    return "Método de Árbol de Recursión";
  } else {
    return "Teorema Maestro";
  }
}

/**
 * Actualiza el mensaje de análisis según el método detectado.
 */
export function updateAnalysisMessageForMethod(
  method: string,
  setAnalysisMessage: (value: string) => void,
): void {
  if (method === "Ecuación Característica") {
    setAnalysisMessage("Aplicando Método de Ecuación Característica...");
  } else if (method === "Método de Iteración") {
    setAnalysisMessage("Aplicando Método de Iteración...");
  } else if (method === "Método de Árbol de Recursión") {
    setAnalysisMessage("Aplicando Método de Árbol de Recursión...");
  } else {
    setAnalysisMessage("Aplicando Teorema Maestro...");
  }
}
