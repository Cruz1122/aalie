"use client";

import type { Program } from "@aa/types";
import { useEffect, useState, useMemo, useCallback } from "react";

import type {
  CaseType,
  TraceApiResponse,
  TraceGraph,
  TraceConfig,
  InternalInput,
} from "@/types/trace";

import IterativeTraceContent from "./trace/IterativeTraceContent";
import RecursiveTraceContent from "./trace/RecursiveTraceContent";
import TraceFlowDiagram from "./TraceFlowDiagram";


interface ExecutionTraceModalProps {
  open: boolean;
  onClose: () => void;
  source: string;
  ast: Program | null;
  caseType: CaseType;
  onCaseChange: (caseType: CaseType) => void;
}

export default function ExecutionTraceModal({
  open,
  onClose,
  source,
  ast: _ast,
  caseType,
  onCaseChange,
}: ExecutionTraceModalProps) {
  const [inputSize, setInputSize] = useState<number>(4);
  const [debouncedInputSize, setDebouncedInputSize] = useState<number>(4);
  const [trace, setTrace] = useState<TraceApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed] = useState(1000); // ms entre pasos
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

  // Configuración de seguimiento derivada del tipo de algoritmo
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

    // Por defecto, tratamos como iterativo
    const makeBaseArray = (n: number): number[] =>
      Array.from({ length: Math.max(1, n) }, (_, idx) => idx + 1);

    // Detectar si el algoritmo tiene condiciones que verifican n = 0
    // Esto es una heurística simple: buscar patrones como "n = 0", "n == 0", "n <= 0", etc.
    const hasZeroCheck = /n\s*[=<>]=\s*0|n\s*=\s*0|IF\s*\(\s*n\s*[=<>]=\s*0/i.test(source);

    const generators = {
      best: (n: number): InternalInput => {
        // Para best case, si hay verificación de n=0, usar n > 0 (no entra a la condición)
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
        // Para worst case, si hay verificación de n=0, usar n = 0 (entra a la condición)
        if (hasZeroCheck) {
          // Si el algoritmo verifica n = 0, el worst case es cuando n = 0
          return { n: 0, array: [], x: undefined };
        }
        // Caso normal: worst case es el último elemento
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

  // Cargar rastro cuando cambia el caso o tamaño de entrada (debounced)
  const loadTrace = useCallback(async () => {
    setLoading(true);
    setCurrentStep(0);
    setIsPlaying(false);
    // No resetear graph aquí para evitar parpadeo - se reseteará cuando realmente cambie el trace
    setExplanation("");
    setRecursionDiagram(null);

    const scenario: CaseType = caseType;
    const n = debouncedInputSize || inputSize || 1;

    // Generar input interno sólo para iterativos
    let initialVariables: Record<string, unknown> | null = null;
    if (traceConfig.kind === "iterative" && traceConfig.inputGenerator) {
      const generator =
        (scenario === "best"
          ? traceConfig.inputGenerator.best
          : scenario === "avg"
            ? traceConfig.inputGenerator.avg
            : traceConfig.inputGenerator.worst) || traceConfig.inputGenerator.worst;

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
        }),
      });

      const data: TraceApiResponse = await response.json();

      // Store algorithm kind FIRST before setting trace
      if (data.algorithmKind) {
        setAlgorithmKind(data.algorithmKind);
      }

      // Resetear graph cuando el trace realmente cambia
      setGraph(null);
      
      // Then set the trace data
      setTrace(data);
    } catch (error) {
      console.error("Error loading trace:", error);
      setTrace({
        ok: false,
        errors: [{ message: "Error al cargar el rastro de ejecución" }],
      });
    } finally {
      setLoading(false);
    }
  }, [caseType, debouncedInputSize, inputSize, source, traceConfig]);

  useEffect(() => {
    if (open && source) {
      // Reset algorithm kind to force re-detection
      setAlgorithmKind(null);
      loadTrace();
    }
  }, [open, caseType, debouncedInputSize, source, loadTrace]);

  // Bloquear scroll del body mientras el modal esté abierto
  useEffect(() => {
    if (!open && !isDiagramExpanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isDiagramExpanded]);

  const isRecursiveOrHybrid =
    algorithmKind === "recursive" || algorithmKind === "hybrid";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 glass-modal-overlay"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 glass-modal-container rounded-2xl p-6 w-[95vw] max-w-[95vw] h-[90vh] mx-4 shadow-2xl flex flex-col">
        {/* Show initial loader while determining algorithm type */}
        {loading && algorithmKind === null ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full animate-ping" />
              <div className="absolute w-8 h-8 bg-blue-500 rounded-full" />
            </div>
            <p className="text-sm text-slate-300">Detectando tipo de algoritmo...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400 text-xl">
                    play_circle
                  </span>
                  Seguimiento de Ejecución
                </h2>
                {trace?.algorithmKind && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${trace.algorithmKind === "recursive"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : trace.algorithmKind === "hybrid"
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      }`}
                  >
                    {trace.algorithmKind === "recursive"
                      ? "Recursivo"
                      : trace.algorithmKind === "hybrid"
                        ? "Híbrido"
                        : "Iterativo"}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                title="Cerrar"
              >
                <span className="material-symbols-outlined text-white">close</span>
              </button>
            </div>

            {/* Render content based on algorithm kind */}
            {isRecursiveOrHybrid ? (
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
              />
            )}

            {/* Expanded diagram modal (shared) */}
            {isDiagramExpanded && (graph || recursionDiagram) && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => setIsDiagramExpanded(false)}
                  role="button"
                  tabIndex={0}
                  aria-label="Cerrar diagrama expandido"
                />
                <div className="relative z-10 w-[98vw] h-[98vh] rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col p-4 gap-3">
                  <div className="flex items-center justify-between flex-shrink-0">
                    <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sky-400 text-lg">
                        {isRecursiveOrHybrid ? "account_tree" : "schema"}
                      </span>
                      <span>{isRecursiveOrHybrid ? "Árbol de Recursión" : "Diagrama de flujo del seguimiento"}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsDiagramExpanded(false)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800/70 hover:bg-slate-700/80 border border-slate-600/60 transition-colors"
                      title="Cerrar"
                    >
                      <span className="material-symbols-outlined text-lg text-slate-200 leading-none">
                        close
                      </span>
                    </button>
                  </div>
                  <div className="flex-1 glass-card rounded-lg overflow-hidden">
                    <TraceFlowDiagram graph={(isRecursiveOrHybrid ? recursionDiagram?.graph : graph) || { nodes: [], edges: [] }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
