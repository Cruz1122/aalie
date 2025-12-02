"use client";

import { useEffect, useState, useRef } from "react";
import type { Program } from "@aa/types";
import TraceFlowDiagram from "./TraceFlowDiagram";
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
  const [trace, setTrace] = useState<TraceApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // ms entre pasos
  const [graph, setGraph] = useState<TraceGraph | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingDiagram, setLoadingDiagram] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const codeLines = source.split("\n");
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(false);

  // Cargar rastro cuando cambia el caso o tamaño de entrada
  useEffect(() => {
    if (open && source) {
      loadTrace();
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [open, caseType, inputSize, source]);

  // Bloquear scroll del body mientras el modal esté abierto
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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
    
    try {
      const response = await fetch("/api/analyze/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          case: caseType,
          input_size: inputSize,
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
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Caso:</label>
            <select
              value={caseType}
              onChange={(e) => onCaseChange(e.target.value as CaseType)}
              className="px-3 py-1 rounded-lg bg-slate-800 text-white text-sm border border-slate-600"
            >
              <option value="worst">Peor caso</option>
              <option value="best">Mejor caso</option>
              <option value="avg">Caso promedio</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Tamaño (n):</label>
            <input
              type="number"
              value={inputSize}
              onChange={(e) =>
                setInputSize(Number.parseInt(e.target.value, 10) || 4)
              }
              min="1"
              max="20"
              className="w-20 px-3 py-1 rounded-lg bg-slate-800 text-white text-sm border border-slate-600"
            />
          </div>
          <button
            onClick={loadTrace}
            disabled={loading}
            className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-40"
          >
            {loading ? "Cargando..." : "Recargar"}
          </button>
        </div>

        {/* Contenido: 3 columnas */}
        <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
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
                      className={`px-2 py-1 ${
                        isCurrentLine
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
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                title="Reiniciar"
              >
                <span className="material-symbols-outlined text-sm text-white">
                  restart_alt
                </span>
              </button>
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-40"
                title="Paso anterior"
              >
                <span className="material-symbols-outlined text-sm text-white">
                  skip_previous
                </span>
              </button>
              {isPlaying ? (
                <button
                  onClick={handlePause}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-colors"
                  title="Pausar"
                >
                  <span className="material-symbols-outlined text-sm text-red-300">
                    pause
                  </span>
                </button>
              ) : (
                <button
                  onClick={handlePlay}
                  disabled={!trace?.ok || currentStep >= (trace.trace?.steps.length || 0) - 1}
                  className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-colors disabled:opacity-40"
                  title="Reproducir"
                >
                  <span className="material-symbols-outlined text-sm text-green-300">
                    play_arrow
                  </span>
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={
                  !trace?.ok ||
                  currentStep >= (trace.trace?.steps.length || 0) - 1
                }
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-40"
                title="Siguiente paso"
              >
                <span className="material-symbols-outlined text-sm text-white">
                  skip_next
                </span>
              </button>
              <div className="flex-1" />
              <span className="text-xs text-slate-400">
                Paso {currentStep + 1} / {trace?.ok ? trace.trace?.steps.length || 0 : 0}
              </span>
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
                <div className="space-y-3">
                  <div className="glass-card p-3 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">Línea:</div>
                    <div className="text-white font-semibold">
                      {currentStepData.line}
                    </div>
                  </div>

                  <div className="glass-card p-3 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">Tipo:</div>
                    <div className="text-white font-semibold capitalize">
                      {currentStepData.kind}
                    </div>
                  </div>

                  {currentStepData.description && (
                    <div className="glass-card p-3 rounded-lg">
                      <div className="text-xs text-slate-400 mb-1">
                        Descripción:
                      </div>
                      <div className="text-white text-sm">
                        {currentStepData.description}
                      </div>
                    </div>
                  )}

                  {currentStepData.iteration && (
                    <div className="glass-card p-3 rounded-lg">
                      <div className="text-xs text-slate-400 mb-1">
                        Iteración:
                      </div>
                      <div className="text-white text-sm">
                        {currentStepData.iteration.loopVar && (
                          <div>
                            {currentStepData.iteration.loopVar} ={" "}
                            {currentStepData.iteration.currentValue}
                            {currentStepData.iteration.maxValue &&
                              ` / ${currentStepData.iteration.maxValue}`}
                          </div>
                        )}
                        {currentStepData.iteration.iteration && (
                          <div>
                            Iteración #{currentStepData.iteration.iteration}
                          </div>
                        )}
                      </div>
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

                  <div className="glass-card p-3 rounded-lg">
                    <div className="text-xs text-slate-400 mb-2">Variables:</div>
                    <div className="space-y-1">
                      {Object.entries(currentStepData.variables).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-300 text-sm">{key}:</span>
                            <span className="text-white text-sm font-mono">
                              {String(value)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {currentStepData.cost && (
                    <div className="glass-card p-3 rounded-lg">
                      <div className="text-xs text-slate-400 mb-1">Coste:</div>
                      <div className="text-white text-sm">
                        {currentStepData.cost}
                        {currentStepData.accumulated_cost && (
                          <div className="text-slate-400 text-xs mt-1">
                            Acumulado: {currentStepData.accumulated_cost}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  {trace?.errors
                    ? trace.errors[0]?.message || "Error al cargar el rastro"
                    : "No hay datos de seguimiento"}
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
                  <div className="glass-card p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-slate-400">Diagrama:</div>
                      <button
                        type="button"
                        onClick={loadDiagram}
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] font-semibold text-slate-200 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-600/60 transition-colors"
                        title="Regenerar diagrama"
                      >
                        <span className="material-symbols-outlined text-xs mr-1">
                          refresh
                        </span>
                        Recargar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDiagramExpanded(true)}
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] font-semibold text-slate-200 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-600/60 transition-colors ml-2"
                        title="Expandir diagrama"
                      >
                        <span className="material-symbols-outlined text-xs mr-1">
                          fullscreen
                        </span>
                        Expandir
                      </button>
                    </div>
                    <TraceFlowDiagram graph={graph} />
                  </div>
                  {explanation && (
                    <div className="glass-card p-3 rounded-lg">
                      <div className="text-xs text-slate-400 mb-2">
                        Explicación:
                      </div>
                      <div className="text-white text-sm whitespace-pre-wrap">
                        {explanation}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  No hay diagrama disponible
                </div>
              )}
            </div>
          </div>
        </div>

        {isDiagramExpanded && graph && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDiagramExpanded(false)}
              role="button"
              tabIndex={0}
              aria-label="Cerrar diagrama expandido"
            />
            <div className="relative z-10 w-[min(95vw,1200px)] h-[min(80vh,700px)] rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col p-4 gap-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-400 text-base">
                    schema
                  </span>
                  <span>Diagrama de flujo del seguimiento</span>
                </h3>
                <button
                  onClick={() => setIsDiagramExpanded(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
                  aria-label="Cerrar diagrama expandido"
                >
                  <span className="material-symbols-outlined text-base">
                    close
                  </span>
                </button>
              </div>
              <div className="flex-1">
                <TraceFlowDiagram graph={graph} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

