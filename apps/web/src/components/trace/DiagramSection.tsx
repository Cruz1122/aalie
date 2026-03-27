"use client";

import { useTranslations } from "next-intl";

import type { TraceGraph } from "@/types/trace";

import ExecutionGraphView from "../ExecutionGraphView";

interface StructuredDiagram {
  graph: TraceGraph;
  patternKind: string;
  classification: { evidence: string[] };
}

interface DiagramSectionProps {
  structuredDiagram?: StructuredDiagram | null;
  loading?: boolean;
  inputSize?: number;
  initialVariablesSummary?: string;
  hasN?: boolean;
  onRegenerate?: () => void;
  onExpand?: () => void;
  traceConfig?: { kind: string };
  fetchCompleted?: boolean;
  frameStyle?: "card" | "border";
}

export default function DiagramSection(props: Readonly<DiagramSectionProps>) {
  const {
    structuredDiagram,
    loading = false,
    inputSize,
    initialVariablesSummary,
    hasN = false,
    onRegenerate,
    onExpand,
    traceConfig,
    fetchCompleted = false,
    frameStyle = "card",
  } = props;
  const t = useTranslations("analyzer.executionTrace");
  const graph = structuredDiagram?.graph;
  const isIterative = traceConfig?.kind === "iterative";

  let diagramNote: string | null = null;
  if (!isIterative) {
    if (hasN && inputSize !== undefined) {
      diagramNote = t("diagramNote", { n: inputSize });
    } else if (initialVariablesSummary) {
      diagramNote = t("diagramNoteVariables", {
        vars: initialVariablesSummary,
      });
    }
  }

  const frameHeightPx = frameStyle === "border" ? 500 : 700;
  const canvasSlotClass = "absolute inset-0 w-full h-full";

  const renderCanvasContent = () => {
    if (loading) {
      return (
        <div
          className={`${canvasSlotClass} flex flex-col items-center justify-center gap-4`}
        >
          <div className="relative flex items-center justify-center">
            <div
              className={`w-12 h-12 rounded-full animate-ping ${
                isIterative ? "bg-blue-500/20" : "bg-purple-500/20"
              }`}
            />
            <div
              className={`absolute w-6 h-6 rounded-full ${
                isIterative ? "bg-blue-500" : "bg-purple-500"
              }`}
            />
          </div>
          <p className="text-xs text-slate-300">
            {isIterative
              ? t("generatingExecutionDiagram")
              : t("generatingCallTree")}
          </p>
        </div>
      );
    }

    if (graph?.nodes?.length) {
      return (
        <div className={canvasSlotClass}>
          <ExecutionGraphView graph={graph} />
        </div>
      );
    }

    if (fetchCompleted) {
      return (
        <div
          className={`${canvasSlotClass} flex flex-col items-center justify-center gap-3`}
        >
          <span className="material-symbols-outlined text-3xl text-amber-500/60">
            info
          </span>
          <div className="text-sm text-slate-400 text-center px-4">
            {isIterative ? t("diagramFailed") : t("callTreeUnavailable")}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`${canvasSlotClass} flex flex-col items-center justify-center gap-3`}
      >
        <span className="material-symbols-outlined text-3xl text-slate-500/50">
          {isIterative ? "schema" : "account_tree"}
        </span>
        <div className="text-sm text-slate-400 text-center px-4">
          {t("diagramPlaceholder")}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full min-h-0 overflow-hidden">
      <div className="flex items-center justify-between h-[40px] px-1 flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">
            {isIterative ? "schema" : "account_tree"}
          </span>
          {isIterative ? t("executionDiagram") : t("callTreeTitle")}
        </h3>

        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60"
            >
              <span className="material-symbols-outlined text-sm text-slate-200">
                refresh
              </span>
            </button>
          )}

          {structuredDiagram && onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60"
            >
              <span className="material-symbols-outlined text-sm text-slate-200">
                fullscreen
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="h-[28px] flex items-center px-1 flex-shrink-0">
        <p className="text-xs text-slate-400 truncate">{diagramNote ?? " "}</p>
      </div>

      <div
        className={`relative flex-none shrink-0 overflow-hidden rounded-lg ${
          frameStyle === "border" ? "border border-slate-700/60" : "glass-card"
        }`}
        style={{
          height: `${frameHeightPx}px`,
          minHeight: `${frameHeightPx}px`,
        }}
      >
        {renderCanvasContent()}
      </div>
    </div>
  );
}
