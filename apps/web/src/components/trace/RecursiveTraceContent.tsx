"use client";

import { useTranslations } from "next-intl";
import { useRef, useEffect } from "react";

import type { TraceGraph } from "@/types/trace";

import MarkdownRenderer from "../MarkdownRenderer";
import DiagramSection from "./DiagramSection";
import InputSizeControl from "./InputSizeControl";
import PseudocodeViewer from "./PseudocodeViewer";
import VariablesPanel from "./VariablesPanel";

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
  debouncedInputSize: _debouncedInputSize,
  setDebouncedInputSize,
  recursionDiagram,
  setRecursionDiagram,
  loading,
  isDiagramExpanded: _isDiagramExpanded,
  setIsDiagramExpanded,
  onLoadTrace,
}: RecursiveTraceContentProps) {
  const t = useTranslations("analyzer.executionTrace");
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Controles superiores - vacío para recursivos */}
      <div className="flex items-center gap-4 mb-2 flex-shrink-0">
        {/* No hay controles superiores para recursivos */}
      </div>

      {/* Contenido: 1 col mobile, 2 cols tablet, 3 cols desktop - scroll en el wrapper padre */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-0 min-w-0">
        {/* Columna izquierda: Pseudocódigo */}
        <PseudocodeViewer source={source} />

        {/* Columna centro: Diagrama de Recursión - scroll en toda la sección */}
        <div className="flex flex-col border-r-0 md:border-r border-slate-700 md:pr-4 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-custom">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0 truncate">
            {t("recursionDiagram")}
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

        {/* Columna derecha: Explicación - scroll en toda la sección */}
        <div className="flex flex-col min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-custom">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0 truncate">
            {t("explanation")}
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
                  {t("explanationPlaceholder")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


