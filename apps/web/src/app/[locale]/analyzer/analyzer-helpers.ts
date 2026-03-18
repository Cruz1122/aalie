/**
 * Funciones helper para reducir la complejidad cognitiva del componente AnalyzerPage.
 * @author Refactored for code quality
 */

import type { AnalyzeOpenResponse, ParseResponse } from "@aa/types";
import type React from "react";

import type { MethodMetadataMap, MethodPrecision, MethodType } from "@/components/MethodSelector";

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

export type GetAnalysisMessage = (key: string) => string;
type SupportedLocale = "es" | "en";

interface DetectionRecurrenceInfo {
  type?: "divide_conquer" | "linear_shift" | string;
  form?: string;
  a?: number;
  b?: number;
  f?: string;
}

const ALL_METHODS: MethodType[] = [
  "characteristic_equation",
  "iteration",
  "recursion_tree",
  "master",
];

const naturalJoin = (parts: string[], locale: SupportedLocale): string => {
  const cleaned = parts.map((item) => item.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) {
    return `${cleaned[0]} ${locale === "es" ? "y" : "and"} ${cleaned[1]}`;
  }
  const last = cleaned[cleaned.length - 1];
  return `${cleaned.slice(0, -1).join(", ")} ${locale === "es" ? "y" : "and"} ${last}`;
};

const getPrecisionByMethod = (
  method: MethodType,
  info: DetectionRecurrenceInfo | undefined,
  recommended: boolean,
): MethodPrecision => {
  if (recommended) return "high";
  if (info?.type === "divide_conquer") {
    if (method === "master" || method === "recursion_tree") return "high";
    if (method === "iteration") return "medium";
    return "low";
  }
  if (info?.type === "linear_shift") {
    if (method === "characteristic_equation") return "high";
    if (method === "iteration") return "medium";
    return "low";
  }
  if (method === "master" || method === "characteristic_equation") return "medium";
  return "low";
};

const getNotApplicableReason = (
  method: MethodType,
  info: DetectionRecurrenceInfo | undefined,
  locale: SupportedLocale,
): string => {
  const divideConquer = info?.type === "divide_conquer";
  const linearShift = info?.type === "linear_shift";

  if (method === "master" && linearShift) {
    return naturalJoin(
      [
        locale === "es"
          ? "El Teorema Maestro se usa para dividir el problema en subproblemas de tamano proporcional"
          : "Master Theorem is intended for recurrences that split the problem into proportional subproblems",
        locale === "es"
          ? "en este caso la recurrencia reduce por desplazamientos constantes como n-1 o n-k"
          : "in this case the recurrence decreases through constant shifts such as n-1 or n-k",
        locale === "es"
          ? "por eso no se cumplen las condiciones formales de T(n)=aT(n/b)+f(n)"
          : "therefore the formal conditions of T(n)=aT(n/b)+f(n) are not satisfied",
      ],
      locale,
    );
  }

  if (method === "characteristic_equation" && divideConquer) {
    return naturalJoin(
      [
        locale === "es"
          ? "La ecuacion caracteristica funciona mejor con recurrencias lineales de desplazamiento constante"
          : "Characteristic equation works best for linear recurrences with constant shifts",
        locale === "es"
          ? "tu algoritmo tiene una forma divide-and-conquer con llamadas de tipo n/b"
          : "your algorithm follows a divide-and-conquer shape with n/b style calls",
        locale === "es"
          ? "por eso este metodo no modela de forma directa la estructura detectada"
          : "so this method does not model the detected structure directly",
      ],
      locale,
    );
  }

  if (method === "recursion_tree" && linearShift) {
    return naturalJoin(
      [
        locale === "es"
          ? "El arbol de recursion es mas didactico cuando hay ramificacion en varios subproblemas"
          : "Recursion tree is more informative when there is branching into multiple subproblems",
        locale === "es"
          ? "esta recurrencia avanza principalmente con un solo desplazamiento lineal"
          : "this recurrence mainly advances with a single linear shift",
        locale === "es"
          ? "por eso su uso aqui no aporta una estimacion tan clara como otros metodos"
          : "therefore its use here does not provide an estimate as clear as other methods",
      ],
      locale,
    );
  }

  if (method === "iteration" && divideConquer) {
    return naturalJoin(
      [
        locale === "es"
          ? "Aunque iteracion puede desplegar la recurrencia, en este caso hay division en subproblemas paralelos"
          : "Although iteration can unroll a recurrence, this case splits into parallel subproblems",
        locale === "es"
          ? "metodos como Teorema Maestro o arbol de recursion suelen ofrecer una cota mas estable"
          : "methods such as Master Theorem or recursion tree usually provide a more stable bound",
      ],
      locale,
    );
  }

  return locale === "es"
    ? "Este metodo no cumple las condiciones detectadas para este patron de recurrencia."
    : "This method does not meet the detected conditions for this recurrence pattern.";
};

const buildMethodMetadata = (
  applicableMethods: MethodType[],
  defaultMethod: MethodType,
  recurrenceInfo: DetectionRecurrenceInfo | undefined,
  locale: SupportedLocale,
): MethodMetadataMap => {
  return ALL_METHODS.reduce(
    (acc, method) => {
      const applicable = applicableMethods.includes(method);
      const recommended = method === defaultMethod;
      acc[method] = {
        applicable,
        recommended,
        precision: applicable
          ? getPrecisionByMethod(method, recurrenceInfo, recommended)
          : "low",
        reason: applicable
          ? (locale === "es"
            ? "Este metodo es compatible con la forma de recurrencia detectada."
            : "This method is compatible with the detected recurrence shape.")
          : getNotApplicableReason(method, recurrenceInfo, locale),
      };
      return acc;
    },
    {} as MethodMetadataMap,
  );
};

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
  getMessage?: GetAnalysisMessage,
): void {
  setAnalysisError(errorMsg);
  const initMsg = getMessage ? getMessage("init") : "Iniciando análisis...";
  setTimeout(() => {
    setAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisMessage(initMsg);
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
  locale: SupportedLocale,
  progressBeforeMethodSelection: number,
  setAnalysisMessage: (value: string) => void,
  setAnalysisProgress: React.Dispatch<React.SetStateAction<number>>,
  setApplicableMethods: (methods: MethodType[]) => void,
  setDefaultMethod: (method: MethodType) => void,
  setMethodMetadata: (metadata: MethodMetadataMap) => void,
  setShowMethodSelector: (show: boolean) => void,
  minProgressRef: React.MutableRefObject<number>,
  methodSelectionPromiseRef: React.MutableRefObject<{
    resolve: (method: MethodType) => void;
    reject: (reason?: unknown) => void;
  } | null>,
  animateProgress: <T = unknown>(
    from: number,
    to: number,
    duration: number,
    setProgress: React.Dispatch<React.SetStateAction<number>>,
    promise?: Promise<T>,
  ) => Promise<T | void>,
  getMessage?: GetAnalysisMessage,
): Promise<MethodType | null> {
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
      recurrence_info?: DetectionRecurrenceInfo;
      errors?: Array<{ message: string }>;
    };

    if (detectMethodsResult.ok && detectMethodsResult.applicable_methods) {
      const methods = detectMethodsResult.applicable_methods;
      const defaultMethodValue = (detectMethodsResult.default_method ||
        "master") as MethodType;

      setApplicableMethods(methods);
      setDefaultMethod(defaultMethodValue);
      setMethodMetadata(
        buildMethodMetadata(
          methods,
          defaultMethodValue,
          detectMethodsResult.recurrence_info,
          locale,
        ),
      );

      if (methods.length > 1) {
        const selectMsg = getMessage
          ? getMessage("selectMethod")
          : "Selecciona el método de análisis...";
        setAnalysisMessage(selectMsg);
        minProgressRef.current = progressBeforeMethodSelection;
        setAnalysisProgress((prev) =>
          Math.max(prev, progressBeforeMethodSelection),
        );

        // Registrar la promesa ANTES de mostrar el selector para que cancelar
        // funcione de inmediato incluso si el usuario hace click muy rápido.
        const selectionPromise = new Promise<MethodType>(
          (resolve, reject) => {
            methodSelectionPromiseRef.current = { resolve, reject };
            setTimeout(() => {
              if (methodSelectionPromiseRef.current) {
                methodSelectionPromiseRef.current.resolve(defaultMethodValue);
                methodSelectionPromiseRef.current = null;
              }
            }, 60000);
          },
        );
        setShowMethodSelector(true);

        const selectedMethod = await selectionPromise.catch((reason: unknown) => {
          if (reason === "METHOD_SELECTION_CANCELLED") {
            return null;
          }
          return defaultMethodValue;
        });

        setShowMethodSelector(false);
        methodSelectionPromiseRef.current = null;
        minProgressRef.current = 0;
        if (selectedMethod === null) {
          return null;
        }
        const methodSelectedMsg = getMessage
          ? getMessage("methodSelected")
          : "Método seleccionado, continuando análisis...";
        setAnalysisMessage(methodSelectedMsg);
        await animateProgress(
          progressBeforeMethodSelection,
          90,
          400,
          setAnalysisProgress,
        );
        return selectedMethod;
      } else {
        const analyzingMsg = getMessage
          ? getMessage("analyzingComplexity")
          : "Iniciando análisis de complejidad...";
        setAnalysisMessage(analyzingMsg);
        await animateProgress(
          progressBeforeMethodSelection,
          90,
          400,
          setAnalysisProgress,
        );
        return defaultMethodValue;
      }
    } else {
      setMethodMetadata(
        buildMethodMetadata([], "master", undefined, locale),
      );
      const analyzingMsg = getMessage
        ? getMessage("analyzingComplexity")
        : "Iniciando análisis de complejidad...";
      setAnalysisMessage(analyzingMsg);
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
    setMethodMetadata(
      buildMethodMetadata([], "master", undefined, locale),
    );
    const analyzingMsg = getMessage
      ? getMessage("analyzingComplexity")
      : "Iniciando análisis de complejidad...";
    setAnalysisMessage(analyzingMsg);
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
 * Devuelve la clave de traducción (analyzer.methods.*), no el texto.
 */
export function detectRecursiveMethod(
  worst: AnalyzeOpenResponse | null | undefined,
  best: AnalyzeOpenResponse | null | undefined,
): "characteristicEquation" | "iterationMethod" | "recursionTree" | "masterTheorem" {
  const method =
    worst?.totals?.recurrence?.method || best?.totals?.recurrence?.method;

  if (method === "characteristic_equation") {
    return "characteristicEquation";
  } else if (method === "iteration") {
    return "iterationMethod";
  } else if (method === "recursion_tree") {
    return "recursionTree";
  } else {
    return "masterTheorem";
  }
}

/**
 * Actualiza el mensaje de análisis según el método detectado.
 */
export function updateAnalysisMessageForMethod(
  methodKey: "characteristicEquation" | "iterationMethod" | "recursionTree" | "masterTheorem",
  setAnalysisMessage: (value: string) => void,
  getMessage?: GetAnalysisMessage,
): void {
  const msg = (key: string, fallback: string) =>
    getMessage ? getMessage(key) : fallback;
  if (methodKey === "characteristicEquation") {
    setAnalysisMessage(msg("applyingCharacteristic", "Aplicando Método de Ecuación Característica..."));
  } else if (methodKey === "iterationMethod") {
    setAnalysisMessage(msg("applyingIteration", "Aplicando Método de Iteración..."));
  } else if (methodKey === "recursionTree") {
    setAnalysisMessage(msg("applyingRecursionTree", "Aplicando Método de Árbol de Recursión..."));
  } else {
    setAnalysisMessage(msg("applyingMaster", "Aplicando Teorema Maestro..."));
  }
}
