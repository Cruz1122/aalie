"use client";

import { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "../MarkdownRenderer";
import PseudocodeViewer from "./PseudocodeViewer";
import InputSizeControl from "./InputSizeControl";
import VariablesPanel from "./VariablesPanel";
import DiagramSection from "./DiagramSection";
import type { TraceGraph } from "@/types/trace";

interface RecursionDiagram {
  graph: TraceGraph;
  explanation: string;
}

interface RecursiveTraceContentProps {
  source: string;
  algorithmKind: string;
  inputSize: number;
  setInputSize: (value: number) => void;
  debouncedInputSize: number;
  setDebouncedInputSize: (value: number) => void;
  recursionDiagram: RecursionDiagram | null;
  setRecursionDiagram: (diagram: RecursionDiagram | null) => void;
  loading: boolean;
  isDiagramExpanded: boolean;
  setIsDiagramExpanded: (expanded: boolean) => void;
  onLoadTrace: () => void;
}

export default function RecursiveTraceContent({
  source,
  algorithmKind,
  inputSize,
  setInputSize,
  debouncedInputSize,
  setDebouncedInputSize,
  recursionDiagram,
  setRecursionDiagram,
  loading,
  isDiagramExpanded,
  setIsDiagramExpanded,
  onLoadTrace,
}: RecursiveTraceContentProps) {
  const inputSizeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce input size changes
  useEffect(() => {
    if (inputSizeDebounceRef.current) {
      clearTimeout(inputSizeDebounceRef.current);
    }

    inputSizeDebounceRef.current = setTimeout(() => {
      setDebouncedInputSize(inputSize);
    }, 800);

    return () => {
      if (inputSizeDebounceRef.current) {
        clearTimeout(inputSizeDebounceRef.current);
      }
    };
  }, [inputSize, setDebouncedInputSize]);

  const handleRegenerate = () => {
    setRecursionDiagram(null);
    onLoadTrace();
  };

  return (
    <>
      {/* Controles superiores - vacío para recursivos */}
      <div className="flex items-center gap-4 mb-2 flex-shrink-0">
        {/* No hay controles superiores para recursivos */}
      </div>

      {/* Contenido: 3 columnas con proporciones ajustadas */}
      <div className="flex-1 grid gap-4 overflow-hidden" style={{ gridTemplateColumns: "0.8fr 1.8fr 1.4fr" }}>
        {/* Columna izquierda: Pseudocódigo */}
        <PseudocodeViewer source={source} />

        {/* Columna centro: Diagrama de Recursión */}
        <div className="flex flex-col border-r border-slate-700 pr-4 overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0">
            Diagrama de Recursión
          </h3>

          <DiagramSection
            mode="recursive"
            recursionDiagram={recursionDiagram}
            pseudocode={source}
            algorithmKind={algorithmKind}
            inputSize={inputSize}
            onDiagramGenerated={(diagram) => setRecursionDiagram(diagram)}
            loadingRecursion={loading}
            onRegenerate={handleRegenerate}
            onExpand={() => setIsDiagramExpanded(true)}
          />
        </div>

        {/* Columna derecha: Explicación */}
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0">
            Explicación
          </h3>

          <InputSizeControl
            value={inputSize}
            min={1}
            max={20}
            onChange={setInputSize}
            debounceMs={800}
          />

          <VariablesPanel
            mode="recursive"
            recursionDiagram={recursionDiagram}
          />

          <div className="flex-1 overflow-y-auto scrollbar-custom mt-2">
            {recursionDiagram?.explanation ? (
              <div className="glass-card p-4 rounded-lg">
                <MarkdownRenderer content={recursionDiagram.explanation} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-slate-500/50">
                    description
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-400 text-center px-4">
                  La explicación aparecerá aquí cuando se genere el diagrama
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

