"use client";

import { useTranslations } from "next-intl";
import { useRef, useEffect, useMemo } from "react";

import type { CaseType, TraceApiResponse, TraceGraph, TraceConfig } from "@/types/trace";

import DiagramSection from "./DiagramSection";
import InputSizeControl from "./InputSizeControl";
import PseudocodeViewer from "./PseudocodeViewer";
import StepControls from "./StepControls";
import StepInfo from "./StepInfo";
import VariablesPanel from "./VariablesPanel";

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
  onLoadTrace: (forceRefresh?: boolean) => void;
  /** "modal" = 3 cols con PseudocodeViewer; "dedicated" = 2 cols sin PseudocodeViewer */
  variant?: "modal" | "dedicated";
}

export default function IterativeTraceContent({
  source,
  caseType,
  onCaseChange,
  traceConfig,
  inputSize,
  setInputSize,
  debouncedInputSize: _debouncedInputSize,
  setDebouncedInputSize,
  trace,
  loading,
  currentStep,
  setCurrentStep,
  isPlaying,
  setIsPlaying,
  playSpeed,
  graph,
  setGraph: _setGraph,
  explanation,
  setExplanation: _setExplanation,
  loadingDiagram: _loadingDiagram,
  setLoadingDiagram: _setLoadingDiagram,
  exampleArray: _exampleArray,
  setExampleArray: _setExampleArray,
  isDiagramExpanded: _isDiagramExpanded,
  setIsDiagramExpanded,
  onLoadTrace,
  variant = "modal",
}: IterativeTraceContentProps) {
  const t = useTranslations("analyzer.executionTrace");
  const tCases = useTranslations("analyzer.cases");
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputSizeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const currentStepRef = useRef<number>(currentStep);

  // Sincronizar currentStepRef con currentStep
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

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

  // El diagrama viene del backend vía executionDiagram en la respuesta de /api/analyze/trace
  const stepsToUse = useMemo(() => {
    return trace?.ok && trace.trace ? trace.trace.steps : [];
  }, [trace]);

  const handlePlay = () => {
    if (stepsToUse.length === 0) return;

    setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      const maxSteps = stepsToUse.length;
      const current = currentStepRef.current;
      if (current >= maxSteps - 1) {
        setIsPlaying(false);
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
        }
      } else {
        setCurrentStep(current + 1);
      }
    }, playSpeed);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
  };

  const handleNext = () => {
    if (stepsToUse.length === 0) return;
    const maxSteps = stepsToUse.length;
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

  const currentStepData = useMemo(() => {
    return stepsToUse.length > 0 && currentStep < stepsToUse.length
      ? stepsToUse[currentStep]
      : null;
  }, [stepsToUse, currentStep]);

  const currentLine = currentStepData?.line || 0;

  // Get initial variables and final variables
  const initialVariables = stepsToUse.length > 0
    ? stepsToUse[0]?.variables || {}
    : {};

  const finalVariables = stepsToUse.length > 0
    ? stepsToUse[stepsToUse.length - 1]?.variables || {}
    : {};

  const caseSelector = traceConfig.controls.scenario && (
    <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-lg p-1 flex-shrink-0">
      <button
        onClick={() => onCaseChange("best")}
        className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${caseType === "best"
            ? "bg-green-500/30 text-green-200 border border-green-500/50"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {tCases("bestShort")}
      </button>
      <button
        onClick={() => onCaseChange("avg")}
        className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${caseType === "avg"
            ? "bg-yellow-500/30 text-yellow-200 border border-yellow-500/50"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {tCases("avgShort")}
      </button>
      <button
        onClick={() => onCaseChange("worst")}
        className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${caseType === "worst"
            ? "bg-red-500/30 text-red-200 border border-red-500/50"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {tCases("worstShort")}
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Contenido: variant modal = 3 cols; dedicated = grid 2 cols con glass-card */}
      {variant === "dedicated" ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-custom">
          {/* Columna izquierda: Seguimiento Paso a Paso */}
          <div className="glass-card p-4 rounded-lg flex flex-col min-h-0 min-w-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 flex-shrink-0 min-w-0">
              <h3 className="text-sm font-semibold text-slate-300 truncate">
                {t("stepByStepTrace")}
              </h3>
              {caseSelector}
            </div>
            <StepControls
              currentStep={currentStep}
              totalSteps={stepsToUse.length}
              isPlaying={isPlaying}
              loading={loading}
              onPlay={handlePlay}
              onPause={handlePause}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onReset={handleReset}
            />
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-custom">
              <StepInfo
                stepData={currentStepData}
                loading={loading}
                trace={trace}
                currentStep={currentStep}
                loadingDiagram={loading}
              />
            </div>
          </div>

          {/* Columna derecha: InputSize + Variables + Diagrama */}
          <div className="glass-card p-4 rounded-lg flex flex-col min-h-0 min-w-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 flex-shrink-0 min-w-0">
              <h3 className="text-sm font-semibold text-slate-300 truncate">
                {t("controlsAndVariables")}
              </h3>
            </div>
            <div className="flex-shrink-0">
              <InputSizeControl
                value={inputSize}
                min={1}
                max={20}
                onChange={(value) => setInputSize(value)}
                debounceMs={800}
                noMargin
              />
              <VariablesPanel
                mode="iterative"
                initialVariables={initialVariables}
                finalVariables={Object.keys(finalVariables).length > 0 ? finalVariables : undefined}
              />
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden mt-3">
              <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0 truncate">
                {t("executionDiagramSection")}
              </h3>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-custom">
                <DiagramSection
                  mode="iterative"
                  graph={graph}
                  loading={loading}
                  explanation={explanation}
                  onRegenerate={() => onLoadTrace(true)}
                  onExpand={() => setIsDiagramExpanded(true)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid gap-4 min-h-0 min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Columna izquierda: Pseudocódigo (solo en modal) */}
          <PseudocodeViewer source={source} currentLine={currentLine} />

          {/* Columna centro: Seguimiento Paso a Paso */}
          <div className="flex flex-col min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-custom">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 flex-shrink-0 min-w-0">
              <h3 className="text-sm font-semibold text-slate-300 truncate">
                {t("stepByStepTrace")}
              </h3>
              {caseSelector}
            </div>
            <StepControls
              currentStep={currentStep}
              totalSteps={stepsToUse.length}
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
              loadingDiagram={loading}
            />
          </div>

          {/* Columna derecha: Controles + Diagrama de flujo */}
          <div className="flex flex-col min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-custom">
            <div className="flex-shrink-0 mb-3">
              <h3 className="text-sm font-semibold text-slate-300 mb-2 truncate">
                {t("controlsAndVariables")}
              </h3>
              <InputSizeControl
                value={inputSize}
                min={1}
                max={20}
                onChange={(value) => setInputSize(value)}
                debounceMs={800}
                noMargin
              />
              <VariablesPanel
                mode="iterative"
                initialVariables={initialVariables}
                finalVariables={Object.keys(finalVariables).length > 0 ? finalVariables : undefined}
              />
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0 truncate">
                {t("executionDiagramSection")}
              </h3>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-custom">
                <DiagramSection
                  mode="iterative"
                  graph={graph}
                  loading={loading}
                  explanation={explanation}
                  onRegenerate={() => onLoadTrace(true)}
                  onExpand={() => setIsDiagramExpanded(true)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

