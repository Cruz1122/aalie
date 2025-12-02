"use client";

import { useEffect, useState, useRef } from "react";
import type { Program } from "@aa/types";
import TraceFlowDiagram from "./TraceFlowDiagram";
import MarkdownRenderer from "./MarkdownRenderer";
import Formula from "./Formula";
import type {
  CaseType,
  DiagramGraphResponse,
  TraceApiResponse,
  TraceGraph,
} from "@/types/trace";

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
  ast,
  caseType,
  onCaseChange,
}: ExecutionTraceModalProps) {
  const [inputSize, setInputSize] = useState<number>(4);
  const [debouncedInputSize, setDebouncedInputSize] = useState<number>(4);
  const [trace, setTrace] = useState<TraceApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // ms entre pasos
  const [graph, setGraph] = useState<TraceGraph | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingDiagram, setLoadingDiagram] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const codeLines = source.split("\n");
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [expandedIteration, setExpandedIteration] = useState(false);

  // Estado para array inicial
  const [arrayName, setArrayName] = useState("A");
  const [initialArray, setInitialArray] = useState<number[]>([1, 2, 3, 4]);

  // Debounce input size changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedInputSize(inputSize);
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputSize]);

  // Reset expanded states when step changes
  useEffect(() => {
    setExpandedDescription(false);
    setExpandedIteration(false);
  }, [currentStep]);

  // Cargar rastro cuando cambia el caso o tamaño de entrada (debounced)
  useEffect(() => {
    if (open && source) {
      loadTrace();
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [open, caseType, debouncedInputSize, source]);

  // Bloquear scroll del body mientras el modal esté abierto
  useEffect(() => {
    if (!open && !isDiagramExpanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isDiagramExpanded]);

  // Cargar diagrama solo una vez por rastro (independiente del caso)
  useEffect(() => {
    if (trace?.ok && trace.trace && !graph) {
      loadDiagram();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace, graph]);

  const loadTrace = async () => {
    setLoading(true);
    setCurrentStep(0);
    setIsPlaying(false);
    setGraph(null);
    setExplanation("");

    try {
      const response = await fetch("/api/analyze/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          case: caseType,
          input_size: inputSize,
          initial_variables: {
            [arrayName]: initialArray
          }
        }),
      });

      const data: TraceApiResponse = await response.json();
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
  };

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

  if (!open) return null;

  const currentStepData = trace?.ok && trace.trace
    ? trace.trace.steps[currentStep]
    : null;
  const currentLine = currentStepData?.line || 0;

  // Helper function to format accumulated cost with abbreviation for long expressions
  const formatAccumulatedCost = (cost: string): string => {
    // Check if it's a sum expression (contains +)
    if (!cost.includes('+')) return cost;

    // Split by + and trim whitespace
    const terms = cost.split('+').map(t => t.trim());

    // If 4 or more terms, abbreviate
    if (terms.length >= 4) {
      // Extract c_x values and format with proper subscript notation
      const formatTerm = (term: string) => {
        // Match c_number or C_number pattern
        const match = term.match(/[cC]_(\d+)/);
        if (match) {
          const num = match[1];
          // Use curly braces for multi-digit subscripts
          return num.length > 1 ? `c_{${num}}` : `c_${num}`;
        }
        return term;
      };

      const first = formatTerm(terms[0]);
      const second = formatTerm(terms[1]);
      const third = formatTerm(terms[2]);
      const last = formatTerm(terms[terms.length - 1]);

      return `${first} + ${second} + ${third} + \\ldots + ${last}`;
    }

    // For less than 4 terms, format each term properly
    return terms.map(term => {
      const match = term.match(/[cC]_(\d+)/);
      if (match) {
        const num = match[1];
        return num.length > 1 ? `c_{${num}}` : `c_${num}`;
      }
      return term;
    }).join(' + ');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 glass-modal-overlay"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 glass-modal-container rounded-2xl p-6 w-[95vw] max-w-[95vw] h-[90vh] mx-4 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400 text-xl">
              play_circle
            </span>
            Seguimiento de Ejecución
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Cerrar"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        {/* Controles superiores */}
        <div className="flex items-center gap-4 mb-4 flex-shrink-0">
          {/* Case Switcher */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Caso:</label>
            <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => onCaseChange("best")}
                className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${caseType === "best"
                  ? "bg-green-500/30 text-green-200 border border-green-500/50"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                Mejor
              </button>
              <button
                onClick={() => onCaseChange("avg")}
                className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${caseType === "avg"
                  ? "bg-yellow-500/30 text-yellow-200 border border-yellow-500/50"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                Promedio
              </button>
              <button
                onClick={() => onCaseChange("worst")}
                className={`px-2 py-1 text-xs rounded-md transition-colors font-semibold ${caseType === "worst"
                  ? "bg-red-500/30 text-red-200 border border-red-500/50"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                Peor
              </button>
            </div>
          </div>
          {/* Size Slider */}
          <div className="flex items-center gap-3 min-w-[220px]">
            <label className="text-sm text-slate-300 whitespace-nowrap">Tamaño (n):</label>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={inputSize}
                onChange={(e) => setInputSize(Number.parseInt(e.target.value, 10))}
                className="flex-1 h-2 bg-slate-700/60 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:bg-slate-700/80 transition-colors"
              />
              <span className="text-sm text-white font-semibold min-w-[35px] text-right bg-slate-700/50 px-2 py-1 rounded border border-white/10">
                {inputSize}
              </span>
            </div>
          </div>

          {/* Array Input */}
          <div className="flex items-center gap-3 min-w-[300px] max-w-[800px] overflow-x-auto scrollbar-custom">
            <label className="text-sm text-slate-300 whitespace-nowrap flex-shrink-0">Array Inicial:</label>
            <div className="flex items-center gap-2 bg-slate-800/60 border border-white/10 rounded-lg p-1">
              <input
                type="text"
                value={arrayName}
                onChange={(e) => setArrayName(e.target.value)}
                className="w-8 bg-transparent text-center text-xs font-mono text-blue-300 border-r border-white/10 focus:outline-none"
                title="Nombre del array"
              />
              <div className="flex items-center gap-1 px-1">
                <span className="text-slate-400 text-xs">[</span>
                {initialArray.map((val, idx) => (
                  <div key={idx} className="relative group flex items-center gap-0.5">
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const newArray = [...initialArray];
                        newArray[idx] = Number(e.target.value);
                        setInitialArray(newArray);
                      }}
                      className="w-10 bg-slate-900/60 rounded text-center text-xs text-white border border-slate-700/50 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:bg-slate-800/50 [&::-webkit-inner-spin-button]:hover:bg-slate-700/50 [&::-webkit-outer-spin-button]:bg-slate-800/50 [&::-webkit-outer-spin-button]:hover:bg-slate-700/50"
                      style={{
                        MozAppearance: 'textfield'
                      }}
                    />
                    <style jsx>{`
                      input[type="number"]::-webkit-inner-spin-button,
                      input[type="number"]::-webkit-outer-spin-button {
                        opacity: 1;
                        background: rgba(30, 41, 59, 0.5);
                        border-radius: 2px;
                        cursor: pointer;
                      }
                      input[type="number"]::-webkit-inner-spin-button:hover,
                      input[type="number"]::-webkit-outer-spin-button:hover {
                        background: rgba(51, 65, 85, 0.6);
                      }
                    `}</style>
                    <button
                      onClick={() => {
                        const newArray = initialArray.filter((_, i) => i !== idx);
                        setInitialArray(newArray);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all text-xs font-bold text-red-400"
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setInitialArray([...initialArray, 0])}
                  className="w-5 h-5 flex items-center justify-center rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors text-xs"
                  title="Agregar elemento"
                >
                  +
                </button>
                <span className="text-slate-400 text-xs">]</span>
              </div>
            </div>
          </div>
          {/* Reload Button - Icon Only */}
          <button
            onClick={loadTrace}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-40 transition-colors"
            title={loading ? "Cargando..." : "Recargar rastro"}
          >
            <span className="material-symbols-outlined text-base leading-none">
              {loading ? "progress_activity" : "refresh"}
            </span>
          </button>
        </div>

        {/* Contenido: 3 columnas con proporciones ajustadas */}
        <div className="flex-1 grid gap-4 overflow-hidden" style={{ gridTemplateColumns: "0.8fr 1.8fr 1.4fr" }}>
          {/* Columna izquierda: Pseudocódigo */}
          <div className="flex flex-col border-r border-slate-700 pr-4 overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0">
              Pseudocódigo
            </h3>
            <div className="flex-1 overflow-y-auto scrollbar-custom">
              <pre className="text-xs font-mono text-slate-300">
                {codeLines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isCurrentLine = lineNum === currentLine;
                  return (
                    <div
                      key={idx}
                      className={`px-2 py-1 ${isCurrentLine
                        ? "bg-blue-500/30 border-l-2 border-blue-400"
                        : ""
                        }`}
                    >
                      <span className="text-slate-500 mr-2">
                        {lineNum.toString().padStart(3, " ")}
                      </span>
                      <span>{line || " "}</span>
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>

          {/* Columna centro: Seguimiento */}
          <div className="flex flex-col border-r border-slate-700 pr-4 overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0">
              Seguimiento Paso a Paso
            </h3>

            {/* Controles de reproducción */}
            <div className="flex flex-col items-center gap-3 mb-4 flex-shrink-0">
              {/* Step Counter */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
                <span className="material-symbols-outlined text-xs text-blue-400">info</span>
                <span className="text-xs text-slate-300 font-semibold">
                  Paso {currentStep + 1} / {trace?.ok ? trace.trace?.steps.length || 0 : 0}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Reiniciar"
                >
                  <span className="material-symbols-outlined text-base text-white leading-none">
                    restart_alt
                  </span>
                </button>
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0 || loading}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Paso anterior"
                >
                  <span className="material-symbols-outlined text-base text-white leading-none">
                    skip_previous
                  </span>
                </button>
                {isPlaying ? (
                  <button
                    onClick={handlePause}
                    disabled={loading}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Pausar"
                  >
                    <span className="material-symbols-outlined text-base text-red-300 leading-none">
                      pause
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handlePlay}
                    disabled={loading || !trace?.ok || currentStep >= (trace.trace?.steps.length || 0) - 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Reproducir"
                  >
                    <span className="material-symbols-outlined text-base text-green-300 leading-none">
                      play_arrow
                    </span>
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={
                    loading ||
                    !trace?.ok ||
                    currentStep >= (trace.trace?.steps.length || 0) - 1
                  }
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Siguiente paso"
                >
                  <span className="material-symbols-outlined text-base text-white leading-none">
                    skip_next
                  </span>
                </button>
              </div>
            </div>

            {/* Información del paso actual */}
            <div className="flex-1 overflow-y-auto scrollbar-custom">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
                    <div className="absolute w-6 h-6 bg-blue-500 rounded-full" />
                  </div>
                  <p className="text-xs text-slate-300">
                    Ejecutando rastro de ejecución...
                  </p>
                </div>
              ) : trace?.ok && currentStepData ? (
                <div className="space-y-3 animate-fade-in" key={currentStep}>
                  {/* Grid for Line, Type, Cost */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="glass-card p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col">
                      <div className="text-xs text-blue-300 mb-2 font-bold text-center">Línea</div>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-white font-semibold text-sm">
                          {currentStepData.line}
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 flex flex-col">
                      <div className="text-xs text-purple-300 mb-2 font-bold text-center">Tipo</div>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-white font-semibold capitalize text-sm">
                          {currentStepData.kind}
                        </div>
                      </div>
                    </div>

                    {currentStepData.cost && (
                      <div className="glass-card p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 flex flex-col">
                        <div className="text-xs text-orange-300 mb-2 font-bold text-center">Coste</div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-white text-sm text-center">
                            <Formula latex={currentStepData.cost} />
                            {currentStepData.accumulated_cost && (
                              <div className="text-slate-400 text-xs mt-1">
                                Acum: <Formula latex={formatAccumulatedCost(currentStepData.accumulated_cost)} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expandable badges for Description and Iteration */}
                  {(currentStepData.description || currentStepData.iteration) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {currentStepData.description && (
                          <button
                            onClick={() => {
                              setExpandedDescription(!expandedDescription);
                              if (!expandedDescription) setExpandedIteration(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 transition-all text-xs font-semibold text-slate-300 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {expandedDescription ? "expand_less" : "expand_more"}
                            </span>
                            Descripción
                          </button>
                        )}

                        {currentStepData.iteration && (
                          <button
                            onClick={() => {
                              setExpandedIteration(!expandedIteration);
                              if (!expandedIteration) setExpandedDescription(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 transition-all text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {expandedIteration ? "expand_less" : "expand_more"}
                            </span>
                            Iteración{currentStepData.iteration.iteration ? ` #${currentStepData.iteration.iteration}` : ""}
                          </button>
                        )}
                      </div>

                      {/* Expanded content area */}
                      {expandedDescription && currentStepData.description && (
                        <div className="glass-card p-3 rounded-lg animate-fade-in min-h-[80px]">
                          <div className="bg-slate-800/40 rounded px-3 py-2 border border-white/5">
                            <div className="text-xs text-slate-400 mb-1">Descripción del paso</div>
                            <div className="text-white text-sm font-medium">
                              {currentStepData.description}
                            </div>
                          </div>
                        </div>
                      )}

                      {expandedIteration && currentStepData.iteration && (
                        <div className="glass-card p-3 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 animate-fade-in min-h-[80px]">
                          {currentStepData.iteration.loopVar && (
                            <div className="bg-slate-800/40 rounded px-3 py-2 border border-white/5">
                              <div className="text-xs text-slate-400 mb-1">Variable de iteración</div>
                              <div className="text-white text-sm font-medium">
                                <Formula latex={`${currentStepData.iteration.loopVar} = ${currentStepData.iteration.currentValue}${currentStepData.iteration.maxValue ? ` / ${currentStepData.iteration.maxValue}` : ""}`} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {currentStepData.recursion && (
                    <div className="glass-card p-3 rounded-lg">
                      <div className="text-xs text-slate-400 mb-1">
                        Recursión:
                      </div>
                      <div className="text-white text-sm">
                        <div>
                          Profundidad: {currentStepData.recursion.depth}
                        </div>
                        {currentStepData.recursion.procedure && (
                          <div>
                            Procedimiento:{" "}
                            {currentStepData.recursion.procedure}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Variables with colorful styling and flex-wrap layout */}
                  <div className="glass-card p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                    <div className="text-xs text-cyan-300 mb-2 font-semibold">Variables:</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(currentStepData.variables).map(
                        ([key, value]) => {
                          const strValue = String(value);
                          const isLarge = strValue.length > 20 || strValue.includes('[');

                          return (
                            <div
                              key={key}
                              className={`bg-slate-800/40 rounded px-2 py-1.5 border border-white/5 flex items-center gap-2 ${isLarge ? "w-full" : "flex-shrink-0"
                                }`}
                            >
                              <span className="text-cyan-200 text-sm font-medium flex-shrink-0">{key}:</span>
                              <div className={`text-white text-sm font-mono ${isLarge ? "flex-1 overflow-x-auto scrollbar-thin" : ""
                                }`}>
                                <Formula latex={strValue} />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl opacity-50">
                      data_object
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {trace?.errors
                      ? trace.errors[0]?.message || "Error al cargar el rastro"
                      : "No hay datos de seguimiento disponibles"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Diagrama y explicación */}
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0">
              Diagrama y Explicación
            </h3>
            <div className="flex-1 overflow-y-auto scrollbar-custom space-y-4">
              {loadingDiagram ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
                    <div className="absolute w-6 h-6 bg-blue-500 rounded-full" />
                  </div>
                  <p className="text-xs text-slate-300">
                    Generando diagrama de flujo...
                  </p>
                </div>
              ) : graph ? (
                <>
                  <div className="glass-card rounded-lg overflow-hidden">
                    {/* Header with title and actions */}
                    <div className="flex items-center justify-between p-3 border-b border-white/5 bg-slate-800/30">
                      <div className="text-sm font-semibold text-slate-300">Diagrama de flujo</div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={loadDiagram}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60 transition-colors"
                          title="Regenerar diagrama"
                        >
                          <span className="material-symbols-outlined text-sm text-slate-200 leading-none">
                            refresh
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDiagramExpanded(true)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60 transition-colors"
                          title="Expandir diagrama"
                        >
                          <span className="material-symbols-outlined text-sm text-slate-200 leading-none">
                            fullscreen
                          </span>
                        </button>
                      </div>
                    </div>
                    {/* Diagram content */}
                    <div className="p-3 h-[300px]">
                      <TraceFlowDiagram graph={graph} />
                    </div>
                  </div>
                  {explanation && (
                    <div className="glass-card p-3 rounded-lg">
                      <div className="text-xs text-slate-400 mb-2">
                        Explicación:
                      </div>
                      <MarkdownRenderer content={explanation} />
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-slate-500/50">
                      schema
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-400 text-center px-4">
                    {explanation || "El diagrama se generará al cargar el rastro"}
                  </div>
                  {/* Show retry button ONLY if there is an error explanation or if we have trace data but no graph */}
                  {(explanation || (trace?.ok && !graph)) && (
                    <button
                      type="button"
                      onClick={loadDiagram}
                      disabled={loadingDiagram}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      <span className="material-symbols-outlined text-sm">
                        refresh
                      </span>
                      Intentar de nuevo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isDiagramExpanded && graph && (
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
                    schema
                  </span>
                  <span>Diagrama de flujo del seguimiento</span>
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
                <TraceFlowDiagram graph={graph} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

