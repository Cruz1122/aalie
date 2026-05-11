"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useRecursionStepper } from "@/hooks/useRecursionStepper";
import type { StructuredTrace } from "@/types/trace";

import ExecutionGraphView from "../ExecutionGraphView";
import RecursionSteppingControls from "./RecursionSteppingControls";

interface DiagramSectionProps {
  structuredDiagram?: StructuredTrace | null;
  loading?: boolean;
  inputSize?: number;
  initialVariablesSummary?: string;
  hasN?: boolean;
  onRegenerate?: () => void;
  onExpand?: () => void;
  traceConfig?: { kind: string };
  traceDiagnostics?: {
    truncated?: boolean;
    truncationReason?: string | null;
  } | null;
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
    traceDiagnostics,
    fetchCompleted = false,
    frameStyle = "card",
  } = props;
  const t = useTranslations("analyzer.executionTrace");
  const graph = structuredDiagram?.graph;
  const isIterative = traceConfig?.kind === "iterative";
  const [maxVisibleDepth, setMaxVisibleDepth] = useState<number | null>(null);

  const recursiveDepth = useMemo(() => {
    if (!graph?.nodes?.length) return null;
    const depths = graph.nodes
      .map((node) => node.data?.depth)
      .filter((value): value is number => typeof value === "number");
    if (!depths.length) return null;
    return Math.max(...depths);
  }, [graph]);

  useEffect(() => {
    setMaxVisibleDepth(null);
  }, [graph?.nodes?.length, graph?.edges?.length]);

  const visibleGraph = useMemo(() => {
    if (!graph) return null;
    if (maxVisibleDepth === null || recursiveDepth === null) return graph;

    const visibleNodeIds = new Set(
      graph.nodes
        .filter((node) => (node.data?.depth ?? 0) <= maxVisibleDepth)
        .map((node) => node.id),
    );

    return {
      nodes: graph.nodes.filter((node) => visibleNodeIds.has(node.id)),
      edges: graph.edges.filter(
        (edge) =>
          visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
      ),
    };
  }, [graph, maxVisibleDepth, recursiveDepth]);

  const [stepState, stepActions] = useRecursionStepper(
    graph?.nodes ?? [],
    graph?.edges ?? [],
  );
  const currentSteppedNode = graph?.nodes?.find(
    (n) => n.id === stepState.currentNodeId,
  );

  const depthLabel =
    maxVisibleDepth === null
      ? t("diagramLevelsAll")
      : t("diagramLevelsCurrent", { depth: maxVisibleDepth });

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

    if (visibleGraph?.nodes?.length) {
      // If stepping is active, intersect stepping-visible nodes with depth-visible nodes
      let effectiveVisibleIds: Set<string> | undefined = undefined;
      if (!isIterative) {
        const depthVisible = new Set(
          (visibleGraph.nodes ?? []).map((n) => n.id),
        );
        effectiveVisibleIds = new Set<string>();
        stepState.visibleNodeIds.forEach((id) => {
          if (depthVisible.has(id)) effectiveVisibleIds!.add(id);
        });
      }

      const effectiveVisibleEdgeIds = new Set(
        (visibleGraph.edges ?? [])
          .map((edge) => edge.id)
          .filter((edgeId) => stepState.visibleEdgeIds.has(edgeId)),
      );

      return (
        <div className={canvasSlotClass}>
          <ExecutionGraphView
            graph={visibleGraph}
            visibleNodeIds={effectiveVisibleIds}
            visibleEdgeIds={effectiveVisibleEdgeIds}
            currentNodeId={stepState.currentNodeId}
          />
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
        <div className="flex items-center justify-between gap-2 w-full">
          <p className="text-xs text-slate-400 truncate">
            {diagramNote ?? " "}
          </p>
          {recursiveDepth !== null && !isIterative && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[10px] uppercase tracking-wide text-slate-500 px-2 py-1 rounded-full border border-white/10 bg-slate-950/20">
                {depthLabel}
              </span>
              <button
                type="button"
                onClick={() =>
                  setMaxVisibleDepth((current) =>
                    current === null ? 0 : Math.max(0, current - 1),
                  )
                }
                className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60 disabled:opacity-40"
                disabled={maxVisibleDepth === 0}
                title={t("diagramLevelsShowLess")}
                aria-label={t("diagramLevelsShowLess")}
              >
                <span className="material-symbols-outlined text-sm text-slate-200">
                  remove
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setMaxVisibleDepth((current) =>
                    current === null
                      ? 0
                      : Math.min(recursiveDepth, current + 1),
                  )
                }
                className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60 disabled:opacity-40"
                disabled={
                  maxVisibleDepth !== null && maxVisibleDepth >= recursiveDepth
                }
                title={t("diagramLevelsShowMore")}
                aria-label={t("diagramLevelsShowMore")}
              >
                <span className="material-symbols-outlined text-sm text-slate-200">
                  add
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMaxVisibleDepth(null)}
                className="px-2 py-1 rounded-md text-[10px] uppercase tracking-wide bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/60 text-slate-200"
              >
                {t("diagramLevelsAll")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stepping controls for recursive traces */}
      {traceDiagnostics?.truncated && (
        <div className="px-1 pb-2 flex items-center gap-2 text-[11px] text-amber-200/90">
          <span className="material-symbols-outlined text-sm text-amber-300/90">
            warning
          </span>
          <span>
            {t("truncationWarning", {
              reason: traceDiagnostics.truncationReason || "partial",
            })}
          </span>
        </div>
      )}

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

      {graph && !isIterative && (
        <div className="mt-3 px-0.5">
          <RecursionSteppingControls
            state={stepState}
            actions={stepActions}
            currentNode={currentSteppedNode}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
