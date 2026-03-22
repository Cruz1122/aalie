"use client";

import { useTranslations } from "next-intl";

import type { TraceGraph } from "@/types/trace";

import ExecutionGraphView from "./ExecutionGraphView";

interface RecurrenceTreeViewProps {
  /** Grafo del árbol de recurrencia (analítico). Proviene del backend deterministico. */
  graph?: TraceGraph | null;
  /** Mensaje cuando no hay datos */
  emptyMessage?: string;
}

/**
 * Vista del árbol de recurrencia (analítico).
 * No confundir con el árbol de llamadas recursivas (ejecución concreta).
 */
export default function RecurrenceTreeView({
  graph,
  emptyMessage,
}: RecurrenceTreeViewProps) {
  const t = useTranslations("analyzer.executionTrace");

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-slate-500/50">
            account_tree
          </span>
        </div>
        <div className="text-sm font-medium text-slate-400 text-center px-4">
          {emptyMessage ?? t("diagramPlaceholder")}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ExecutionGraphView graph={graph} />
    </div>
  );
}
