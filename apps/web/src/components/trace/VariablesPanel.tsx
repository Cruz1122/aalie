"use client";

import type { TraceGraph } from "@/types/trace";

interface RecursionDiagram {
  graph: TraceGraph;
  explanation: string;
}

interface VariablesPanelProps {
  mode: "iterative" | "recursive";
  initialVariables?: Record<string, unknown>;
  finalVariables?: Record<string, unknown>;
  recursionDiagram?: RecursionDiagram | null;
}

export default function VariablesPanel({
  mode,
  initialVariables,
  finalVariables,
  recursionDiagram,
}: VariablesPanelProps) {
  if (mode === "recursive") {
    // Para recursivos, extraer información del diagrama LLM
    if (!recursionDiagram?.graph?.nodes?.length) {
      return null;
    }

    const nodes = recursionDiagram.graph.nodes as Array<{
      id: string;
      data?: { label?: string };
    }>;

    const firstNode = nodes[0];
    const initialLabel =
      (firstNode && typeof firstNode.data?.label === "string"
        ? firstNode.data.label
        : "") || "No disponible";

    // Intentar primero con el id canónico "end_node"
    let endNode = nodes.find((n) => n.id === "end_node") || null;

    // Fallback heurístico por si el modelo no respetó exactamente el id
    if (!endNode && nodes.length > 0) {
      endNode =
        nodes.find(
          (n) =>
            typeof n.data?.label === "string" &&
            (n.id.toLowerCase().includes("end") ||
              n.id.toLowerCase().includes("final") ||
              n.data.label.includes("Resultado") ||
              n.data.label.includes("→")),
        ) || null;
    }

    return (
      <div className="mb-3 grid grid-cols-1 gap-2">
        <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10">
          <div className="text-[11px] text-slate-400 mb-1 font-semibold">
            Variables iniciales
          </div>
          <p className="text-[11px] text-slate-200 font-mono whitespace-pre-wrap">
            {initialLabel}
          </p>
        </div>
        {endNode ? (
          <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10">
            <div className="text-[11px] text-slate-400 mb-1 font-semibold">
              Variables finales
            </div>
            <p className="text-[11px] text-slate-200 font-mono whitespace-pre-wrap">
              {endNode.data?.label}
            </p>
          </div>
        ) : (
          <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10">
            <div className="text-[11px] text-slate-400 mb-1 font-semibold">
              Variables finales
            </div>
            <p className="text-[11px] text-slate-400">
              No se pudo identificar un nodo de resultado final en el diagrama.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Modo iterativo
  if (!initialVariables && !finalVariables) {
    return null;
  }

  return (
    <div className="mb-3 grid grid-cols-1 gap-2">
      {/* Variables iniciales */}
      {initialVariables && Object.keys(initialVariables).length > 0 && (
        <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10">
          <div className="text-[11px] text-slate-400 mb-1 font-semibold">
            Variables iniciales
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(initialVariables)
              .slice(0, 6)
              .map(([key, value]) => (
                <span
                  key={key}
                  className="text-[11px] text-slate-200 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/60"
                >
                  {key} = {String(value)}
                </span>
              ))}
            {Object.keys(initialVariables).length > 6 && (
              <span className="text-[11px] text-slate-400">
                + más variables
              </span>
            )}
          </div>
        </div>
      )}
      {/* Variables finales */}
      {finalVariables && Object.keys(finalVariables).length > 0 && (
        <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10">
          <div className="text-[11px] text-slate-400 mb-1 font-semibold">
            Variables finales
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(finalVariables)
              .slice(0, 6)
              .map(([key, value]) => (
                <span
                  key={key}
                  className="text-[11px] text-slate-200 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/60"
                >
                  {key} = {String(value)}
                </span>
              ))}
            {Object.keys(finalVariables).length > 6 && (
              <span className="text-[11px] text-slate-400">
                + más variables
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

