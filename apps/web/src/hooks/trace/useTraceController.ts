"use client";

import { useCallback, useState, useRef , useMemo } from "react";


import type {
  CaseType,
  TraceApiResponse,
  TraceGraph,
  TraceConfig,
  InternalInput,
} from "@/types/trace";

import { useTraceCache } from "./useTraceCache";

export interface UseTraceControllerParams {
  source: string;
  caseType: CaseType;
  inputSize: number;
  debouncedInputSize: number;
  locale: string;
  initialVariablesOverride: Record<string, unknown> | null;
}

export interface UseTraceControllerResult {
  trace: TraceApiResponse | null;
  loading: boolean;
  error: string | null;
  truncated: boolean;
  truncationReason: string | null;
  /** true una vez que el primer fetch completó (con éxito o fallo). */
  fetchCompleted: boolean;
  /** Diagrama estructurado (única fuente). */
  structuredDiagram: { graph: TraceGraph; patternKind: string; classification: { evidence: string[] } } | null;
  algorithmKind: string | null;
  traceConfig: TraceConfig;
  loadTrace: (
    forceRefresh?: boolean,
    effectiveOverride?: Record<string, unknown> | null,
  ) => Promise<void>;
  setAlgorithmKind: (kind: string | null) => void;
  setExampleArray: (arr: number[]) => void;
  exampleArray: number[];
}

/**
 * Hook que centraliza la lógica de carga del trace: fetch, cache, normalización.
 * Extrae la responsabilidad de TraceDedicatedView.
 *
 * @author Plan refactor subsistema trace (Bloque G)
 * @version 0.2.0
 */
export function useTraceController(
  params: UseTraceControllerParams,
  t: (key: string) => string,
): UseTraceControllerResult {
  const {
    source,
    caseType,
    inputSize,
    debouncedInputSize,
    locale,
    initialVariablesOverride,
  } = params;

  const traceCache = useTraceCache();
  const [trace, setTrace] = useState<TraceApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCompleted, setFetchCompleted] = useState(false);
  const [structuredDiagram, setStructuredDiagram] = useState<{
    graph: TraceGraph;
    patternKind: string;
    classification: { evidence: string[] };
  } | null>(null);
  const [algorithmKind, setAlgorithmKind] = useState<string | null>(null);
  const [exampleArray, setExampleArray] = useState<number[]>([1, 2, 3, 4]);
  // Permite cancelar requests anteriores cuando llega uno nuevo
  const abortControllerRef = useRef<AbortController | null>(null);

  const traceConfig: TraceConfig = useMemo(() => {
    if (algorithmKind === "recursive") {
      return {
        kind: "recursive",
        controls: { scenario: false, n: true, arrayEditable: false },
      };
    }
    if (algorithmKind === "hybrid") {
      return {
        kind: "hybrid",
        controls: { scenario: false, n: true, arrayEditable: false },
      };
    }
    const makeBaseArray = (n: number): number[] =>
      Array.from({ length: Math.max(1, n) }, (_, idx) => idx + 1);
    const hasZeroCheck =
      /n\s*[=<>]=\s*0|n\s*=\s*0|IF\s*\(\s*n\s*[=<>]=\s*0/i.test(source);
    const generators = {
      best: (n: number): InternalInput => {
        const actualN = hasZeroCheck ? Math.max(1, n) : n;
        const arr = makeBaseArray(actualN);
        return { n: actualN, array: arr, x: arr[0] };
      },
      avg: (n: number): InternalInput => {
        const actualN = hasZeroCheck ? Math.max(1, n) : n;
        const arr = makeBaseArray(actualN);
        const midIndex = Math.floor(Math.max(1, actualN) / 2);
        return { n: actualN, array: arr, x: arr[midIndex] ?? arr[arr.length - 1] };
      },
      worst: (n: number): InternalInput => {
        if (hasZeroCheck) return { n: 0, array: [], x: undefined };
        const arr = makeBaseArray(n);
        return { n, array: arr, x: arr[arr.length - 1] };
      },
    };
    return {
      kind: "iterative",
      controls: { scenario: true, n: true, arrayEditable: true },
      inputGenerator: generators,
    };
  }, [algorithmKind, source]);

  const loadTrace = useCallback(
    async (
      forceRefresh?: boolean,
      effectiveOverride?: Record<string, unknown> | null,
    ) => {
      // Cancelar cualquier request en vuelo antes de iniciar uno nuevo
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const usesX = /(^|[^A-Za-z0-9_])x([^A-Za-z0-9_]|$)/i.test(source);

      setLoading(true);
      setError(null);
      setStructuredDiagram(null);

      const scenario: CaseType = caseType;
      const overrideToUse =
        effectiveOverride !== undefined ? effectiveOverride : initialVariablesOverride;

      const nFromOverride =
        overrideToUse &&
        Array.isArray(overrideToUse.A) &&
        overrideToUse.A.length > 0
          ? overrideToUse.A.length
          : null;
      const nFromSelector = debouncedInputSize || inputSize || 1;
      const n = nFromOverride ?? nFromSelector;

      let variablesFromGenerator: Record<string, unknown> | null = null;
      const nVal = n;
      const makeBaseArray = (size: number) =>
        Array.from({ length: Math.max(1, size) }, (_, idx) => idx + 1);
      if (traceConfig.kind === "iterative" && traceConfig.inputGenerator) {
        const generator =
          (scenario === "best"
            ? traceConfig.inputGenerator.best
            : scenario === "avg"
              ? traceConfig.inputGenerator.avg
              : traceConfig.inputGenerator.worst) ||
          traceConfig.inputGenerator.worst;
        if (generator) {
          const internalInput = generator(n);
          const arr = internalInput.array ?? [];
          const x = internalInput.x;
          const variables: Record<string, unknown> = {};
          if (arr.length > 0) variables.A = arr;
          if (usesX && typeof x !== "undefined") variables.x = x;
          variablesFromGenerator =
            Object.keys(variables).length > 0 ? variables : null;
          const arrToUse =
            overrideToUse && Array.isArray(overrideToUse.A)
              ? (overrideToUse.A as number[])
              : arr;
          if (arrToUse.length > 0) setExampleArray(arrToUse);
        }
      }
      if (
        !variablesFromGenerator &&
        (traceConfig.kind === "recursive" || traceConfig.kind === "hybrid")
      ) {
        const isSortingSource = /(merge|quick|heap|bubble|insertion|selection|sort|ordenar|mezclar|particionar)/i.test(
          source,
        );
        const baseArr = makeBaseArray(nVal);
        const arr = isSortingSource ? [...baseArr].reverse() : baseArr;
        if (usesX) {
          const x = arr[Math.floor(arr.length / 2)] ?? arr[arr.length - 1];
          variablesFromGenerator = { A: arr, x };
        } else {
          variablesFromGenerator = { A: arr };
        }
      }

      const initialVariables = overrideToUse ?? variablesFromGenerator;

      const cacheKey = traceCache.getKey({
        source,
        case: scenario,
        inputSize: n,
        initialVariablesOverride: overrideToUse ?? null,
        locale: locale === "es" ? "es" : "en",
      });

      if (typeof window !== "undefined" && !forceRefresh) {
        try {
          const cached = traceCache.get(cacheKey);
          if (cached?.data?.ok) {
            const cachedData = cached.data;
            const cachedHasX = cachedData.trace?.steps?.some(
              (step) => step.variables && Object.hasOwn(step.variables, "x"),
            );
            if (!usesX && cachedHasX) {
              throw new Error("Cache contains x, bypassing.");
            }
            setAlgorithmKind(
              cachedData.algorithmKind ??
                cachedData.trace?.kind ??
                "unknown",
            );
            const st = cachedData.derived?.structuredTrace;
            if (st?.graph && (st.graph.nodes?.length ?? 0) > 0) {
              setStructuredDiagram({
                graph: st.graph,
                patternKind: st.patternKind,
                classification: st.classification,
              });
            } else {
              setStructuredDiagram(null);
            }
            setTrace(cachedData);
            setFetchCompleted(true);
            setLoading(false);
            return;
          }
        } catch {
          // Ignorar errores de cache
        }
      }

      try {
        const timeoutId = setTimeout(() => abortController.abort(), 30_000);
        const response = await fetch("/api/analyze/trace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source,
            case: scenario,
            input_size: n,
            initial_variables: initialVariables,
            locale: locale === "es" ? "es" : "en",
          }),
          signal: abortController.signal,
        });
        clearTimeout(timeoutId);

        const data: TraceApiResponse = await response.json();

        // #region agent log
        try {
          fetch("http://127.0.0.1:7642/ingest/4e868e29-6cb7-4d4c-abab-40d6b95cd3c7", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "1b7cca",
            },
            body: JSON.stringify({
              sessionId: "1b7cca",
              runId: "initial",
              hypothesisId: "H3",
              location: "useTraceController.ts:after_fetch",
              message: "trace_response_received",
              data: {
                ok: data?.ok ?? null,
                algorithmKind: data?.algorithmKind ?? data?.trace?.kind ?? null,
                stepsCount: data?.trace?.steps?.length ?? null,
                hasStructuredTrace: Boolean(data?.derived?.structuredTrace),
                graphNodes: data?.derived?.structuredTrace?.graph?.nodes?.length ?? null,
                graphEdges: data?.derived?.structuredTrace?.graph?.edges?.length ?? null,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
        } catch {
          // Ignorar errores de logging de depuración
        }
        // #endregion agent log

        setAlgorithmKind(
          data.algorithmKind ?? data.trace?.kind ?? "unknown",
        );

        const st = data.derived?.structuredTrace;
        if (st?.graph && (st.graph.nodes?.length ?? 0) > 0) {
          setStructuredDiagram({
            graph: st.graph,
            patternKind: st.patternKind,
            classification: st.classification,
          });
        } else {
          setStructuredDiagram(null);
        }
        setTrace(data);
        setFetchCompleted(true);

        if (typeof window !== "undefined" && data?.ok) {
          traceCache.set(cacheKey, data);
        }
      } catch (err) {
        // Request cancelado intencionalmente — no actualizar estado de UI
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Error loading trace:", err);
        setError(t("loadError"));
        setAlgorithmKind("unknown");
        setTrace({
          ok: false,
          errors: [{ message: t("loadError") }],
        });
        setFetchCompleted(true);
      } finally {
        // Solo limpiar loading si este controller sigue siendo el activo
        if (abortControllerRef.current === abortController) {
          setLoading(false);
        }
      }
    },
    [
      caseType,
      debouncedInputSize,
      inputSize,
      source,
      traceConfig,
      locale,
      traceCache,
      initialVariablesOverride,
      t,
    ],
  );

  const truncated =
    trace?.ok === true && trace?.trace?.diagnostics?.truncated === true;
  const truncationReason = trace?.trace?.diagnostics?.truncationReason ?? null;

  return {
    trace,
    loading,
    error,
    truncated,
    truncationReason,
    fetchCompleted,
    structuredDiagram,
    algorithmKind,
    traceConfig,
    loadTrace,
    setAlgorithmKind,
    setExampleArray,
    exampleArray,
  };
}
