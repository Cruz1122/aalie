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
  onLoadTrace: (forceRefresh?: boolean) => void;
  /** "modal" = 3 cols con PseudocodeViewer; "dedicated" = 2 cols sin PseudocodeViewer */
  variant?: "modal" | "dedicated";
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
  variant = "modal",
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
    onLoadTrace(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Contenido: variant dedicated = apilado (diagrama arriba, explicación abajo); modal = 3 cols */}
      <div
        className={`flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-custom ${
          variant === "dedicated"
            ? "flex flex-col gap-4"
            : "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {variant === "modal" && <PseudocodeViewer source={source} />}

        {/* Diagrama (dedicated: arriba; modal: columna centro) */}
        <div className="flex flex-col min-w-0 flex-1 min-h-[280px] overflow-hidden">
          <DiagramSection
            mode="recursive"
            recursionDiagram={recursionDiagram}
            loadingRecursion={loading}
            inputSize={inputSize}
            onRegenerate={handleRegenerate}
            onExpand={() => setIsDiagramExpanded(true)}
          />
        </div>

        {/* Explicación (dedicated: abajo; modal: columna derecha) */}
        <div className="flex flex-col min-h-0 min-w-0 flex-1">
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
                <MarkdownRenderer content={recursionDiagram.explanation} hideHorizontalRules />
              </div>
            ) : (
              <div className="h-full min-h-[120px] flex flex-col items-center justify-center gap-3">
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


