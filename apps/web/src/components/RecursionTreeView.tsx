"use client";

import { useEffect, useState, useRef } from "react";

import type { TraceGraph } from "@/types/trace";

import TraceFlowDiagram from "./TraceFlowDiagram";

interface RecursionCall {
  id: string;
  depth: number;
  params: Record<string, unknown>;
  children: string[];
}

interface RecursionTreeViewProps {
  calls: RecursionCall[];
  rootCalls: string[];
  pseudocode?: string;
  algorithmKind?: string;
  inputSize?: number;
  onRegenerate?: () => void;
  onDiagramGenerated?: (diagram: RecursionDiagram) => void;
}

interface RecursionDiagram {
  graph: TraceGraph;
  explanation: string;
}

export default function RecursionTreeView({
  calls,
  rootCalls: _rootCalls,
  pseudocode,
  algorithmKind,
  inputSize,
  onRegenerate: _onRegenerate,
  onDiagramGenerated,
}: RecursionTreeViewProps) {
  const [diagram, setDiagram] = useState<RecursionDiagram | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    // Generar diagrama solo una vez al montar
    if (!hasGeneratedRef.current && pseudocode) {
      hasGeneratedRef.current = true;
      generateDiagram();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateDiagram = async () => {
    if (!pseudocode) {
      setError("No se proporcionó pseudocódigo para generar el diagrama");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/llm/recursion-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudocode,
          kind: algorithmKind || "recursive",
          depth_limit: 10,
          input_size: inputSize || 5,
          hints: {
            // Extraer parámetros de las llamadas si existen
            params: calls.length > 0 ? Object.keys(calls[0].params) : [],
          },
        }),
      });

      const data = await response.json();

      if (data.ok && data.graph) {
        const newDiagram = {
          graph: data.graph,
          explanation: data.explanation || "",
        };
        setDiagram(newDiagram);

        // Notificar al padre que se generó el diagrama
        if (onDiagramGenerated) {
          onDiagramGenerated(newDiagram);
        }
      } else {
        setError(data.error || "Error al generar el diagrama de recursión");
      }
    } catch (err) {
      console.error("Error generando diagrama de recursión:", err);
      setError("Error de conexión al generar el diagrama");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full animate-ping" />
          <div className="absolute w-6 h-6 bg-purple-500 rounded-full" />
        </div>
        <p className="text-xs text-slate-300">
          Generando diagrama de recursión con LLM...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-900/40 flex items-center justify-center border border-blue-500/40">
          <span className="material-symbols-outlined text-2xl text-blue-300">
            error
          </span>
        </div>
        <div className="text-sm font-medium text-blue-300 text-center px-4">
          {error}
        </div>
        <button
          onClick={generateDiagram}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Reintentar
        </button>
      </div>
    );
  }

  if (!diagram) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-slate-500/50">
            account_tree
          </span>
        </div>
        <div className="text-sm font-medium text-slate-400 text-center px-4">
          No hay diagrama de recursión disponible
        </div>
      </div>
    );
  }

  // Solo devolver el diagrama, la explicación se mostrará en otra columna
  return (
    <div className="h-full flex flex-col">
      <TraceFlowDiagram graph={diagram.graph} />
    </div>
  );
}
