"use client";

import { useState, useRef, useEffect } from "react";
import type { CaseType, TraceApiResponse, TraceGraph, TraceConfig, DiagramGraphResponse } from "@/types/trace";
import PseudocodeViewer from "./PseudocodeViewer";
import StepControls from "./StepControls";
import StepInfo from "./StepInfo";
import InputSizeControl from "./InputSizeControl";
import VariablesPanel from "./VariablesPanel";
import DiagramSection from "./DiagramSection";

interface IterativeTraceContentProps {
  source: string;
  caseType: CaseType;
  onCaseChange: (caseType: CaseType) => void;
  traceConfig: TraceConfig;
  inputSize: number;
  setInputSize: (value: number) => void;
  debouncedInputSize: number;
  setDebouncedInputSize: (value: number) => void;
  trace: TraceApiResponse | null;
  loading: boolean;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playSpeed: number;
  graph: TraceGraph | null;
  setGraph: (graph: TraceGraph | null) => void;
  explanation: string;
  setExplanation: (explanation: string) => void;
  loadingDiagram: boolean;
  setLoadingDiagram: (loading: boolean) => void;
  exampleArray: number[];
  setExampleArray: (arr: number[]) => void;
  isDiagramExpanded: boolean;
  setIsDiagramExpanded: (expanded: boolean) => void;
  onLoadTrace: () => void;
}

export default function IterativeTraceContent({
  source,
  caseType,
  onCaseChange,
  traceConfig,
  inputSize,
  setInputSize,
  debouncedInputSize,
  setDebouncedInputSize,
  trace,
  loading,
  currentStep,
  setCurrentStep,
  isPlaying,
  setIsPlaying,
  playSpeed,
  graph,
  setGraph,
  explanation,
  setExplanation,
  loadingDiagram,
  setLoadingDiagram,
  exampleArray,
  setExampleArray,
  isDiagramExpanded,
  setIsDiagramExpanded,
  onLoadTrace,
}: IterativeTraceContentProps) {
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputSizeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce input size changes
  useEffect(() => {
    if (inputSizeDebounceRef.current) {
      clearTimeout(inputSizeDebounceRef.current);
    }

    inputSizeDebounceRef.current = setTimeout(() => {
      setDebouncedInputSize(inputSize);
    }, 500);

    return () => {
      if (inputSizeDebounceRef.current) {
        clearTimeout(inputSizeDebounceRef.current);
      }
    };
  }, [inputSize, setDebouncedInputSize]);

  // Cleanup play interval
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  const loadDiagram = async () => {
    if (!trace?.ok || !trace.trace) return;

    setLoadingDiagram(true);
    try {
      const response = await fetch("/api/llm/generate-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trace: trace.trace,
          source,
          case: caseType,
        }),
      });

      const data: DiagramGraphResponse = await response.json();
      if (data.ok && data.graph) {
        setGraph(data.graph);
        setExplanation(data.explanation || "");
      } else {
        setGraph(null);
        setExplanation(data.error || data.explanation || "");
      }
    } catch (error) {
      console.error("Error loading diagram:", error);
    } finally {
      setLoadingDiagram(false);
    }
  };

  // Load diagram when trace is available
  useEffect(() => {
    if (trace?.ok && trace.trace && !graph) {
      loadDiagram();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace, graph]);

  const handlePlay = () => {
    if (!trace?.ok || !trace.trace) return;

    setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const maxSteps = trace.trace!.steps.length;
        if (prev >= maxSteps - 1) {
          setIsPlaying(false);
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
          }
          return prev;
        }
        return prev + 1;
      });
    }, playSpeed);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
  };

  const handleNext = () => {
    if (!trace?.ok || !trace.trace) return;
    const maxSteps = trace.trace.steps.length;
    if (currentStep < maxSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
  };

  const currentStepData = trace?.ok && trace.trace
    ? trace.trace.steps[currentStep]
    : null;
  const currentLine = currentStepData?.line || 0;

  // Get initial variables and final return
  const initialVariables = trace?.ok && trace.trace
    ? trace.trace.steps[0]?.variables || {}
    : {};
  
  const finalReturn = trace?.ok && trace.trace
    ? (() => {
        const steps = trace.trace.steps;
        const lastReturn = [...steps]
          .reverse()
          .find((s) => s.kind === "return");
        return lastReturn?.description || undefined;
      })()
    : undefined;

  return (
    <>
      {/* Controles superiores */}
      <div className="flex items-center gap-4 mb-2 flex-shrink-0">
        {/* Case Switcher */}
        {traceConfig.controls.scenario && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Caso:</label>
            <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => onCaseChange("best")}
                className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${
                  caseType === "best"
                    ? "bg-green-500/30 text-green-200 border border-green-500/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Mejor
              </button>
              <button
                onClick={() => onCaseChange("avg")}
                className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${
                  caseType === "avg"
                    ? "bg-yellow-500/30 text-yellow-200 border border-yellow-500/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Promedio
              </button>
              <button
                onClick={() => onCaseChange("worst")}
                className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${
                  caseType === "worst"
                    ? "bg-red-500/30 text-red-200 border border-red-500/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Peor
              </button>
            </div>
          </div>
        )}

        {/* Reload Button */}
        <button
          onClick={onLoadTrace}
          disabled={loading}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-40 transition-colors"
          title={loading ? "Cargando..." : "Recargar rastro"}
        >
          <span className="material-symbols-outlined text-base leading-none">
            {loading ? "progress_activity" : "refresh"}
          </span>
        </button>
      </div>

      {/* Texto aclaratorio global para iterativos */}
      <p className="text-xs text-slate-400 mb-4">
        El caso seleccionado (mejor/peor/promedio) se refleja en un input generado automáticamente; el arreglo mostrado es solo un ejemplo no editable.
      </p>

      {/* Contenido: 3 columnas con proporciones ajustadas */}
      <div className="flex-1 grid gap-4 overflow-hidden" style={{ gridTemplateColumns: "0.8fr 1.8fr 1.4fr" }}>
        {/* Columna izquierda: Pseudocódigo */}
        <PseudocodeViewer source={source} currentLine={currentLine} />

        {/* Columna centro: Seguimiento Paso a Paso */}
        <div className="flex flex-col border-r border-slate-700 pr-4 overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0">
            Seguimiento Paso a Paso
          </h3>

          <StepControls
            currentStep={currentStep}
            totalSteps={trace?.ok ? trace.trace?.steps.length || 0 : 0}
            isPlaying={isPlaying}
            loading={loading}
            onPlay={handlePlay}
            onPause={handlePause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onReset={handleReset}
          />

          <StepInfo
            stepData={currentStepData}
            loading={loading}
            trace={trace}
            currentStep={currentStep}
          />
        </div>

        {/* Columna derecha: Diagrama de flujo */}
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0">
            Diagrama de Flujo
          </h3>
          
          <InputSizeControl
            value={inputSize}
            min={1}
            max={20}
            onChange={(value) => {
              setInputSize(value);
            }}
            debounceMs={800}
          />

          <VariablesPanel
            mode="iterative"
            initialVariables={initialVariables}
            finalReturn={finalReturn}
          />

          <DiagramSection
            mode="iterative"
            graph={graph}
            loading={loadingDiagram}
            explanation={explanation}
            onRegenerate={loadDiagram}
            onExpand={() => setIsDiagramExpanded(true)}
          />
        </div>
      </div>
    </>
  );
}

