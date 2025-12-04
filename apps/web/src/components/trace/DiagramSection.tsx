"use client";

import TraceFlowDiagram from "../TraceFlowDiagram";
import MarkdownRenderer from "../MarkdownRenderer";
import RecursionTreeView from "../RecursionTreeView";
import type { TraceGraph } from "@/types/trace";

interface RecursionDiagram {
  graph: TraceGraph;
  explanation: string;
}

interface DiagramSectionProps {
  mode: "iterative" | "recursive";
  graph?: TraceGraph | null;
  loading?: boolean;
  explanation?: string;
  onRegenerate?: () => void;
  onExpand?: () => void;
  // Para modo recursivo
  recursionDiagram?: RecursionDiagram | null;
  pseudocode?: string;
  algorithmKind?: string;
  inputSize?: number;
  onDiagramGenerated?: (diagram: RecursionDiagram) => void;
  loadingRecursion?: boolean;
}

export default function DiagramSection({
  mode,
  graph,
  loading = false,
  explanation,
  onRegenerate,
  onExpand,
  recursionDiagram,
  pseudocode,
  algorithmKind,
  inputSize,
  onDiagramGenerated,
  loadingRecursion = false,
}: DiagramSectionProps) {
  if (mode === "recursive") {
    return (
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header con título y botones */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              account_tree
            </span>
            Árbol de Recursión
          </h3>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60 transition-colors"
                title="Regenerar diagrama"
              >
                <span className="material-symbols-outlined text-sm text-slate-200 leading-none">
                  refresh
                </span>
              </button>
            )}
            {recursionDiagram && onExpand && (
              <button
                onClick={onExpand}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60 transition-colors"
                title="Expandir diagrama"
              >
                <span className="material-symbols-outlined text-sm text-slate-200 leading-none">
                  fullscreen
                </span>
              </button>
            )}
          </div>
        </div>
        {/* Advertencia contextual sobre el caso mostrado */}
        {inputSize !== undefined && (
          <p className="text-xs text-slate-400 mb-2">
            Este diagrama muestra un ejemplo de ejecución para n = {inputSize}; no corresponde necesariamente al peor caso, sino a un caso típico de tamaño n.
          </p>
        )}
        
        {/* Diagrama en contenedor con altura completa */}
        <div className="flex-1 overflow-hidden glass-card rounded-lg">
          {loadingRecursion ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full animate-ping" />
                <div className="absolute w-6 h-6 bg-purple-500 rounded-full" />
              </div>
              <p className="text-xs text-slate-300">
                Generando árbol de recursión...
              </p>
            </div>
          ) : (
            <RecursionTreeView
              calls={[]}
              rootCalls={[]}
              pseudocode={pseudocode}
              algorithmKind={algorithmKind}
              inputSize={inputSize}
              onDiagramGenerated={onDiagramGenerated}
            />
          )}
        </div>
      </div>
    );
  }

  // Modo iterativo
  return (
    <div className="flex-1 overflow-y-auto scrollbar-custom space-y-4">
      {loading ? (
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
                {onRegenerate && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60 transition-colors"
                    title="Regenerar diagrama"
                  >
                    <span className="material-symbols-outlined text-sm text-slate-200 leading-none">
                      refresh
                    </span>
                  </button>
                )}
                {onExpand && (
                  <button
                    type="button"
                    onClick={onExpand}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60 transition-colors"
                    title="Expandir diagrama"
                  >
                    <span className="material-symbols-outlined text-sm text-slate-200 leading-none">
                      fullscreen
                    </span>
                  </button>
                )}
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
          {onRegenerate && (explanation || graph === null) && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={loading}
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
  );
}

