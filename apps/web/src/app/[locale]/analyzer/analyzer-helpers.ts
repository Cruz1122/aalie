/**
 * Funciones helper para reducir la complejidad cognitiva del componente AnalyzerPage.
 * @author Refactored for code quality
 */

import type { AnalyzeOpenResponse, ParseResponse } from "@aa/types";
import type React from "react";

import type {
  MethodMetadataMap,
  MethodPrecision,
  MethodType,
} from "@/components/MethodSelector";

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
  strategy_family?: {
    key?: string;
    label?: string;
    description?: string;
  };
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
    if (method === "iteration") return "low";
    return "low";
  }
  if (info?.type === "linear_shift") {
    if (method === "characteristic_equation") return "high";
    if (method === "iteration") return "medium";
    return "low";
  }
  if (method === "master" || method === "characteristic_equation")
    return "medium";
  return "low";
};

const getApplicableReason = (
  method: MethodType,
  info: DetectionRecurrenceInfo | undefined,
  recommended: boolean,
  locale: SupportedLocale,
): string => {
  const divideConquer = info?.type === "divide_conquer";
  const linearShift = info?.type === "linear_shift";
  const isSingleBranchDivideConquer =
    divideConquer && Number(info?.a ?? 0) === 1;
  const familyLabel =
    info?.strategy_family?.label ||
    (divideConquer
      ? "Divide y Vencerás"
      : linearShift
        ? "Resta y Vencerás"
        : "");

  if (recommended) {
    return locale === "es"
      ? `${familyLabel ? `La recurrencia cae en ${familyLabel}. ` : ""}Este método modela la estructura matemática de forma más directa y, por eso, normalmente produce una derivación más corta y estable.`
      : `${familyLabel ? `The recurrence falls into ${familyLabel}. ` : ""}This method matches the mathematical structure most directly, so it usually yields a shorter and more stable derivation.`;
  }

  if (divideConquer && method === "recursion_tree") {
    return locale === "es"
      ? "Útil para Divide y Vencerás: permite ver costo por nivel (raíz, intermedios, hojas) y entender visualmente por qué aparece la cota final."
      : "Useful for Divide y Vencerás: it exposes per-level cost (root, internal levels, leaves) and makes the final bound visually clear.";
  }

  if (divideConquer && method === "iteration") {
    return isSingleBranchDivideConquer
      ? locale === "es"
        ? "Aplica en la variante de rama única: se puede desplegar geométricamente y llegar a la cota, aunque suele requerir más manipulación algebraica que Master o árbol."
        : "It applies for the single-branch variant: geometric unrolling can reach the bound, though it usually needs more algebraic manipulation than Master or tree."
      : locale === "es"
        ? "Es viable, pero en Divide y Vencerás con varias ramas suele ser más largo y menos transparente que resolver por casos de Master o por niveles del árbol."
        : "It is viable, but for multi-branch Divide y Vencerás it is usually longer and less transparent than solving by Master cases or tree levels.";
  }

  if (linearShift && method === "iteration") {
    return locale === "es"
      ? "En Resta y Vencerás funciona bien para mostrar cómo se acumula el costo paso a paso; es una buena vía pedagógica aunque no siempre la más compacta."
      : "In Resta y Vencerás it works well to show step-by-step cost accumulation; pedagogically strong, though not always the most compact path.";
  }

  return locale === "es"
    ? "Este método es compatible con la forma detectada y puede llegar a una cota válida, pero no ofrece la ruta más clara para este patrón."
    : "This method is compatible with the detected shape and can reach a valid bound, but it is not the clearest path for this pattern.";
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
          ? "Teorema Maestro es para Divide y Vencerás, donde el tamaño baja por razón (n/b)"
          : "Master Theorem is for Divide y Vencerás, where size shrinks by ratio (n/b)",
        locale === "es"
          ? "aquí estamos en una familia de Resta y Vencerás/Resta y Serás Vencido, con decrementos tipo n-1 o n-k"
          : "here we are in a Resta y Vencerás/Resta y Serás Vencido family with decrements like n-1 or n-k",
        locale === "es"
          ? "por eso no se cumplen sus hipótesis formales"
          : "therefore its formal assumptions are not satisfied",
      ],
      locale,
    );
  }

  if (method === "characteristic_equation" && divideConquer) {
    return naturalJoin(
      [
        locale === "es"
          ? "Ecuación característica describe mejor recurrencias de Resta y Vencerás con desplazamientos constantes"
          : "Characteristic equation best describes Resta y Vencerás recurrences with constant shifts",
        locale === "es"
          ? "tu recurrencia es de Divide y Vencerás con subproblemas del tipo n/b"
          : "your recurrence is Divide y Vencerás with n/b-style subproblems",
        locale === "es"
          ? "por eso este método no es la herramienta natural para este patrón"
          : "so this method is not the natural tool for this pattern",
      ],
      locale,
    );
  }

  if (method === "recursion_tree" && linearShift) {
    return naturalJoin(
      [
        locale === "es"
          ? "El árbol de recursión brilla en Divide y Vencerás, cuando hay ramificación clara por niveles"
          : "Recursion tree shines in Divide y Vencerás, where level-by-level branching is explicit",
        locale === "es"
          ? "aquí la recurrencia avanza casi linealmente (n, n-1, n-2)"
          : "here the recurrence progresses almost linearly (n, n-1, n-2)",
        locale === "es"
          ? "por eso suele aportar menos que ecuación característica o iteración"
          : "so it usually adds less value than characteristic equation or iteration",
      ],
      locale,
    );
  }

  if (method === "iteration" && divideConquer) {
    return naturalJoin(
      [
        locale === "es"
          ? "En Divide y Vencerás con múltiples ramas, iterar término a término crece rápido en complejidad algebraica"
          : "In multi-branch Divide y Vencerás, term-by-term unrolling grows algebraically fast",
        locale === "es"
          ? "Master o árbol suelen dar una ruta más limpia para justificar la cota"
          : "Master or recursion tree usually provide a cleaner route to justify the bound",
      ],
      locale,
    );
  }

  return locale === "es"
    ? "Este método no coincide con la familia recursiva detectada ni con sus supuestos matemáticos de base."
    : "This method does not match the detected recurrence family nor its core mathematical assumptions.";
};

const buildMethodMetadata = (
  applicableMethods: MethodType[],
  defaultMethod: MethodType,
  recurrenceInfo: DetectionRecurrenceInfo | undefined,
  locale: SupportedLocale,
): MethodMetadataMap => {
  return ALL_METHODS.reduce((acc, method) => {
    const applicable = applicableMethods.includes(method);
    const recommended = method === defaultMethod;
    acc[method] = {
      applicable,
      recommended,
      precision: applicable
        ? getPrecisionByMethod(method, recurrenceInfo, recommended)
        : "low",
      reason: applicable
        ? getApplicableReason(method, recurrenceInfo, recommended, locale)
        : getNotApplicableReason(method, recurrenceInfo, locale),
    };
    return acc;
  }, {} as MethodMetadataMap);
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
        const selectionPromise = new Promise<MethodType>((resolve, reject) => {
          methodSelectionPromiseRef.current = { resolve, reject };
          setTimeout(() => {
            if (methodSelectionPromiseRef.current) {
              methodSelectionPromiseRef.current.resolve(defaultMethodValue);
              methodSelectionPromiseRef.current = null;
            }
          }, 60000);
        });
        setShowMethodSelector(true);

        const selectedMethod = await selectionPromise.catch(
          (reason: unknown) => {
            if (reason === "METHOD_SELECTION_CANCELLED") {
              return null;
            }
            return defaultMethodValue;
          },
        );

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
      setMethodMetadata(buildMethodMetadata([], "master", undefined, locale));
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
    setMethodMetadata(buildMethodMetadata([], "master", undefined, locale));
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
):
  | "characteristicEquation"
  | "iterationMethod"
  | "recursionTree"
  | "masterTheorem" {
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
  methodKey:
    | "characteristicEquation"
    | "iterationMethod"
    | "recursionTree"
    | "masterTheorem",
  setAnalysisMessage: (value: string) => void,
  getMessage?: GetAnalysisMessage,
): void {
  const msg = (key: string, fallback: string) =>
    getMessage ? getMessage(key) : fallback;
  if (methodKey === "characteristicEquation") {
    setAnalysisMessage(
      msg(
        "applyingCharacteristic",
        "Aplicando Método de Ecuación Característica...",
      ),
    );
  } else if (methodKey === "iterationMethod") {
    setAnalysisMessage(
      msg("applyingIteration", "Aplicando Método de Iteración..."),
    );
  } else if (methodKey === "recursionTree") {
    setAnalysisMessage(
      msg("applyingRecursionTree", "Aplicando Método de Árbol de Recursión..."),
    );
  } else {
    setAnalysisMessage(msg("applyingMaster", "Aplicando Teorema Maestro..."));
  }
}
