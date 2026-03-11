"use client";

import type { Program } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import ReactDOM from "react-dom";

import type {
  CaseType,
  TraceApiResponse,
  TraceGraph,
  TraceConfig,
  InternalInput,
} from "@/types/trace";

import IterativeTraceContent from "./trace/IterativeTraceContent";
import RecursiveTraceContent from "./trace/RecursiveTraceContent";
import TraceChatPanel from "./trace/TraceChatPanel";
import TraceFlowDiagram from "./TraceFlowDiagram";

/**
 * Vista dedicada de seguimiento de pseudocódigo (iterativo y recursivo).
 * Layout: panel izquierdo tipo chat (pseudocódigo con progreso) + área principal.
 *
 * @author AALIE
 * @version 0.1.0
 */
interface TraceDedicatedViewProps {
  source: string;
  ast: Program | null;
  caseType: CaseType;
  onCaseChange: (caseType: CaseType) => void;
  onBack: () => void;
}

const TRACE_CACHE_KEY = "analyzerTraceCache";
const TRACE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

export default function TraceDedicatedView({
  source,
  ast: _ast,
  caseType,
  onCaseChange,
  onBack,
}: TraceDedicatedViewProps) {
  const locale = useLocale();
  const t = useTranslations("analyzer.executionTrace");
  const [inputSize, setInputSize] = useState<number>(4);
  const [debouncedInputSize, setDebouncedInputSize] = useState<number>(4);
  const [trace, setTrace] = useState<TraceApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed] = useState(1000);
  const [graph, setGraph] = useState<TraceGraph | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingDiagram, setLoadingDiagram] = useState(false);
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(false);
  const [recursionDiagram, setRecursionDiagram] = useState<{
    graph: TraceGraph;
    explanation: string;
  } | null>(null);
  const [algorithmKind, setAlgorithmKind] = useState<string | null>(null);
  const [exampleArray, setExampleArray] = useState<number[]>([1, 2, 3, 4]);
  const isLoadingRef = useRef(false);

  const traceConfig: TraceConfig = useMemo(() => {
    if (algorithmKind === "recursive") {
      return {
        kind: "recursive",
        controls: {
          scenario: false,
          n: true,
          arrayEditable: false,
        },
      };
    }
    if (algorithmKind === "hybrid") {
      return {
        kind: "hybrid",
        controls: {
          scenario: false,
          n: true,
          arrayEditable: false,
        },
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
        const x = arr[0];
        return { n: actualN, array: arr, x };
      },
      avg: (n: number): InternalInput => {
        const actualN = hasZeroCheck ? Math.max(1, n) : n;
        const arr = makeBaseArray(actualN);
        const midIndex = Math.floor(Math.max(1, actualN) / 2);
        const x = arr[midIndex] ?? arr[arr.length - 1];
        return { n: actualN, array: arr, x };
      },
      worst: (n: number): InternalInput => {
        if (hasZeroCheck) {
          return { n: 0, array: [], x: undefined };
        }
        const arr = makeBaseArray(n);
        const x = arr[arr.length - 1];
        return { n, array: arr, x };
      },
    };
    return {
      kind: "iterative",
      controls: {
        scenario: true,
        n: true,
        arrayEditable: false,
      },
      inputGenerator: generators,
    };
  }, [algorithmKind, source]);

  const loadTrace = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setCurrentStep(0);
    setIsPlaying(false);
    setExplanation("");
    setRecursionDiagram(null);

    const scenario: CaseType = caseType;
    const n = debouncedInputSize || inputSize || 1;

    const cacheKey = `${TRACE_CACHE_KEY}:${btoa(encodeURIComponent(source.substring(0, 200)))}:${scenario}:${n}`;
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data: cachedData, ts } = JSON.parse(cached) as {
            data: TraceApiResponse;
            ts: number;
          };
          if (Date.now() - ts < TRACE_CACHE_TTL_MS && cachedData?.ok) {
            setAlgorithmKind(cachedData.algorithmKind ?? null);
            setGraph(null);
            setTrace(cachedData);
            setLoading(false);
            isLoadingRef.current = false;
            return;
          }
        }
      } catch {
        // Ignorar errores de cache
      }
    }

    let initialVariables: Record<string, unknown> | null = null;
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
        if (arr.length > 0) {
          variables.A = arr;
        }
        if (typeof x !== "undefined") {
          variables.x = x;
        }
        initialVariables = Object.keys(variables).length > 0 ? variables : null;
        if (arr.length > 0) {
          setExampleArray(arr);
        }
      }
    }

    try {
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
      });

      const data: TraceApiResponse = await response.json();

      if (data.algorithmKind) {
        setAlgorithmKind(data.algorithmKind);
      }

      setGraph(null);
      setTrace(data);

      if (typeof window !== "undefined" && data?.ok) {
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ data, ts: Date.now() }),
          );
        } catch {
          // Ignorar si sessionStorage está lleno
        }
      }
    } catch (error) {
      console.error("Error loading trace:", error);
      setTrace({
        ok: false,
        errors: [{ message: t("loadError") }],
      });
    } finally {
      setLoading(false);
    }
  }, [caseType, debouncedInputSize, inputSize, source, traceConfig, t, locale]);

  const loadedParamsRef = useRef<string | null>(null);
  const previousSourceKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!source) return;
    const paramsKey = `${caseType}-${debouncedInputSize}-${source.substring(0, 100)}`;
    if (loadedParamsRef.current === paramsKey) return;
    loadedParamsRef.current = paramsKey;
    const sourceKey = source.substring(0, 100);
    if (previousSourceKeyRef.current !== sourceKey) {
      previousSourceKeyRef.current = sourceKey;
      setAlgorithmKind(null);
    }
    loadTrace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseType, debouncedInputSize, source, locale]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isDiagramExpanded && (graph || recursionDiagram)) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isDiagramExpanded, graph, recursionDiagram]);

  const isRecursiveOrHybrid =
    algorithmKind === "recursive" || algorithmKind === "hybrid";

  const stepsToUse =
    trace?.ok && trace?.trace?.steps ? trace.trace.steps : [];
  const currentStepData =
    stepsToUse.length > 0 && currentStep < stepsToUse.length
      ? stepsToUse[currentStep]
      : null;
  const currentLine = currentStepData?.line || 0;
  const totalSteps = stepsToUse.length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Content - misma estructura de grid y cards que la pantalla de análisis; sin loader al cambiar de vista */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna izquierda: pseudocódigo - misma estructura que análisis (glass-card) */}
          <section className="lg:col-span-4 h-full">
            <div className="glass-card !shadow-none p-4 rounded-lg h-full flex flex-col">
              <TraceChatPanel
                source={source}
                currentLine={isRecursiveOrHybrid ? undefined : currentLine}
                currentStep={currentStep}
                totalSteps={isRecursiveOrHybrid ? 0 : totalSteps}
                onBack={onBack}
              />
            </div>
          </section>

          {/* Columna derecha: contenido principal - misma estructura que análisis */}
          <section className="lg:col-span-8 h-full">
            <div className="glass-card !shadow-none p-4 rounded-lg h-full flex flex-col min-h-0 overflow-hidden">
            {algorithmKind === null ? (
              <div className="flex-1 min-h-[200px]" aria-hidden />
            ) : isRecursiveOrHybrid ? (
              <RecursiveTraceContent
                source={source}
                algorithmKind={algorithmKind || "recursive"}
                inputSize={inputSize}
                setInputSize={setInputSize}
                debouncedInputSize={debouncedInputSize}
                setDebouncedInputSize={setDebouncedInputSize}
                recursionDiagram={recursionDiagram}
                setRecursionDiagram={setRecursionDiagram}
                loading={loading}
                isDiagramExpanded={isDiagramExpanded}
                setIsDiagramExpanded={setIsDiagramExpanded}
                onLoadTrace={loadTrace}
                variant="dedicated"
              />
            ) : (
              <IterativeTraceContent
                source={source}
                caseType={caseType}
                onCaseChange={onCaseChange}
                traceConfig={traceConfig}
                inputSize={inputSize}
                setInputSize={setInputSize}
                debouncedInputSize={debouncedInputSize}
                setDebouncedInputSize={setDebouncedInputSize}
                trace={trace}
                loading={loading}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                playSpeed={playSpeed}
                graph={graph}
                setGraph={setGraph}
                explanation={explanation}
                setExplanation={setExplanation}
                loadingDiagram={loadingDiagram}
                setLoadingDiagram={setLoadingDiagram}
                exampleArray={exampleArray}
                setExampleArray={setExampleArray}
                isDiagramExpanded={isDiagramExpanded}
                setIsDiagramExpanded={setIsDiagramExpanded}
                onLoadTrace={loadTrace}
                variant="dedicated"
              />
            )}
            </div>
          </section>
        </div>

      {/* Expanded diagram modal - portal a body para overlay en toda la pantalla (evita cuadrado de blur por transform en ancestros) */}
      {isDiagramExpanded &&
        (graph || recursionDiagram) &&
        typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div
              className="absolute inset-0 glass-modal-overlay"
              onClick={() => setIsDiagramExpanded(false)}
              role="button"
              tabIndex={0}
              aria-label={t("closeExpandedDiagram")}
            />
            <div className="relative z-10 w-[96vw] max-w-[96vw] h-[96vh] max-h-[96dvh] rounded-xl glass-modal-container !shadow-none flex flex-col overflow-hidden">
              <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 glass-modal-header !shadow-none rounded-t-xl">
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-400 text-lg">
                    {isRecursiveOrHybrid ? "account_tree" : "schema"}
                  </span>
                  <span>
                    {isRecursiveOrHybrid
                      ? t("recursionTreeTitle")
                      : t("flowDiagramTitle")}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDiagramExpanded(false)}
                  className="text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  title={t("close")}
                  aria-label={t("close")}
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 min-h-0 p-3 bg-slate-900/80">
                <TraceFlowDiagram
                  graph={
                    (isRecursiveOrHybrid ? recursionDiagram?.graph : graph) || {
                      nodes: [],
                      edges: [],
                    }
                  }
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
