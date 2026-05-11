"use client";

import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  type EdgeTypes,
  type Edge,
  type Node,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTranslations } from "next-intl";
import React, { useMemo, useEffect } from "react";

import { getLayoutedGraph } from "@/lib/layout/traceGraphLayout";
import type { TraceGraph, GraphNode, GraphEdge } from "@/types/trace";

import ReturnEdge from "./edges/ReturnEdge";

interface ExecutionGraphViewProps {
  readonly graph: TraceGraph;
  /** Set of visible node IDs for stepping visualization */
  readonly visibleNodeIds?: Set<string>;
  /** Set of visible edge IDs for stepping visualization */
  readonly visibleEdgeIds?: Set<string>;
  /** ID of the currently highlighted node */
  readonly currentNodeId?: string | null;
}
const TraceNode = ({
  data,
}: {
  data: {
    label: string;
    isReturn?: boolean;
    type?: string;
    microseconds?: number;
    tokens?: number;
    iterationPath?: string;
  };
}) => {
  const t = useTranslations("analyzer.executionTrace");
  const isReturn = data.isReturn || false;
  const type = data.type || "default";
  const firstLine = (data.label || "").split("\n")[0]?.trim();
  const isFin = firstLine ? /^FIN$/i.test(firstLine) : false;
  const hasCosts = data.microseconds !== undefined || data.tokens !== undefined;
  const hasIteration = Boolean(data.iterationPath);
  const iterationDepth = data.iterationPath
    ? data.iterationPath.split(".").length
    : 1;
  const iterationLight = Math.min(1, (iterationDepth - 1) * 0.35);

  // Detectar si es un nodo de RETURN puro (para hacerlo más compacto)
  const trimmedLabel = data.label.trim();
  const isPureReturn =
    /^(RETURN|Retorna)(\s+|$)/i.test(trimmedLabel) &&
    !/^(RETURN|Retorna)\s+\S+/i.test(trimmedLabel);

  let borderColor = "border-slate-600/70";
  let bgColor = "bg-slate-800/80";
  let shadowColor = "shadow-sky-500/10";

  if (type === "input") {
    borderColor = "border-blue-500/70";
    bgColor = "bg-blue-900/30";
    shadowColor = "shadow-blue-500/20";
  } else if (type === "iteration") {
    borderColor = "border-amber-500/70";
    bgColor = "bg-amber-900/20";
    shadowColor = "shadow-amber-500/20";
  } else if (type === "output" || isFin) {
    borderColor = "border-green-500/70";
    bgColor = "bg-green-900/30";
    shadowColor = "shadow-green-500/20";
  } else if (isReturn || isPureReturn) {
    borderColor = "border-green-500/70";
    bgColor = "bg-green-900/30";
    shadowColor = "shadow-green-500/20";
  }

  const handleStyle = {
    background: "#ffffff",
    width: 8,
    height: 8,
    border: "2px solid #0f172a",
  };

  const iterationStyle =
    type === "iteration"
      ? {
          borderColor: `rgba(245, 158, 11, ${0.6 + 0.3 * iterationLight})`,
          backgroundColor: `rgba(251, 191, 36, ${0.16 + 0.24 * iterationLight})`,
          boxShadow: `0 10px 20px -12px rgba(251, 191, 36, ${0.18 + 0.2 * iterationLight})`,
        }
      : undefined;

  const iterationBadgeStyle =
    type === "iteration"
      ? {
          backgroundColor: `rgba(251, 191, 36, ${0.16 + 0.22 * iterationLight})`,
          borderColor: `rgba(245, 158, 11, ${0.4 + 0.35 * iterationLight})`,
          color: `rgba(253, 230, 138, ${0.7 + 0.3 * iterationLight})`,
        }
      : undefined;

  const iterationCostBadgeStyle =
    type === "iteration"
      ? {
          backgroundColor: `rgba(251, 191, 36, ${0.18 + 0.2 * iterationLight})`,
          borderColor: `rgba(245, 158, 11, ${0.4 + 0.35 * iterationLight})`,
        }
      : undefined;

  const costBadgeStyles =
    type === "iteration"
      ? {
          microBg: "bg-amber-500/20",
          microBorder: "border-amber-500/40",
          microText: "text-amber-200",
          microIcon: "text-amber-300",
          tokenBg: "bg-amber-500/20",
          tokenBorder: "border-amber-500/40",
          tokenText: "text-amber-200",
          tokenIcon: "text-amber-300",
        }
      : {
          microBg: "bg-green-500/20",
          microBorder: "border-green-500/40",
          microText: "text-green-200",
          microIcon: "text-green-300",
          tokenBg: "bg-cyan-500/20",
          tokenBorder: "border-cyan-500/40",
          tokenText: "text-cyan-200",
          tokenIcon: "text-cyan-300",
        };

  const formatMicroseconds = (microseconds: number): string => {
    if (microseconds < 1) {
      return `${(microseconds * 1000).toFixed(2)} ${t("timeUnitNs")}`;
    } else if (microseconds < 1000) {
      return `${microseconds.toFixed(2)} ${t("timeUnitUs")}`;
    } else if (microseconds < 1000000) {
      return `${(microseconds / 1000).toFixed(2)} ${t("timeUnitMs")}`;
    } else {
      return `${(microseconds / 1000000).toFixed(2)} ${t("timeUnitS")}`;
    }
  };

  // Si es un nodo de RETURN puro, mostrarlo de forma compacta
  if (isPureReturn) {
    return (
      <div
        className={`relative rounded-full border ${borderColor} ${bgColor} text-slate-50 px-3 py-2 shadow-sm ${shadowColor} backdrop-blur-sm opacity-60`}
        style={{ zIndex: 10 }}
      >
        {type !== "input" && (
          <>
            <Handle
              id="top"
              type="target"
              position={Position.Top}
              style={handleStyle}
            />
            <Handle
              id="bottom"
              type="target"
              position={Position.Bottom}
              style={handleStyle}
            />
            <Handle
              id="left"
              type="target"
              position={Position.Left}
              style={handleStyle}
            />
            <Handle
              id="right"
              type="target"
              position={Position.Right}
              style={handleStyle}
            />
          </>
        )}
        <div className="text-center text-xs flex items-center gap-1">
          <span className="material-symbols-outlined text-sm leading-none">
            keyboard_return
          </span>
        </div>
        {type !== "output" && (
          <>
            <Handle
              id="top"
              type="source"
              position={Position.Top}
              style={handleStyle}
            />
            <Handle
              id="bottom"
              type="source"
              position={Position.Bottom}
              style={handleStyle}
            />
            <Handle
              id="left"
              type="source"
              position={Position.Left}
              style={handleStyle}
            />
            <Handle
              id="right"
              type="source"
              position={Position.Right}
              style={handleStyle}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-lg border ${borderColor} ${bgColor} text-slate-50 text-sm sm:text-base px-5 py-3 shadow-md ${shadowColor} backdrop-blur-sm min-w-[240px] max-w-[500px]`}
      style={{ ...(iterationStyle || {}), zIndex: 30 }}
    >
      {type !== "input" && (
        <>
          <Handle
            id="top"
            type="target"
            position={Position.Top}
            style={handleStyle}
          />
          <Handle
            id="bottom"
            type="target"
            position={Position.Bottom}
            style={handleStyle}
          />
          <Handle
            id="left"
            type="target"
            position={Position.Left}
            style={handleStyle}
          />
          <Handle
            id="right"
            type="target"
            position={Position.Right}
            style={handleStyle}
          />
        </>
      )}
      {hasIteration && (
        <div className="mb-2 flex items-center justify-center">
          <span
            className="text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40"
            style={iterationBadgeStyle}
          >
            {t("iterationBadge", { id: data.iterationPath })}
          </span>
        </div>
      )}
      <div className="text-center px-1 font-medium whitespace-pre-line leading-snug">
        {data.label}
      </div>
      {hasCosts && (
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-center gap-3 text-xs">
          {data.microseconds !== undefined && (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded ${costBadgeStyles.microBg} border ${costBadgeStyles.microBorder}`}
              style={iterationCostBadgeStyle}
            >
              <span
                className={`material-symbols-outlined ${costBadgeStyles.microIcon} text-sm leading-none`}
              >
                schedule
              </span>
              <span className={`${costBadgeStyles.microText} font-medium`}>
                {formatMicroseconds(data.microseconds)}
              </span>
            </div>
          )}
          {data.tokens !== undefined && (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded ${costBadgeStyles.tokenBg} border ${costBadgeStyles.tokenBorder}`}
              style={iterationCostBadgeStyle}
            >
              <span
                className={`material-symbols-outlined ${costBadgeStyles.tokenIcon} text-sm leading-none`}
              >
                calculate
              </span>
              <span className={`${costBadgeStyles.tokenText} font-medium`}>
                {data.tokens}
              </span>
            </div>
          )}
        </div>
      )}
      {type !== "output" && (
        <>
          <Handle
            id="top"
            type="source"
            position={Position.Top}
            style={handleStyle}
          />
          <Handle
            id="bottom"
            type="source"
            position={Position.Bottom}
            style={handleStyle}
          />
          <Handle
            id="left"
            type="source"
            position={Position.Left}
            style={handleStyle}
          />
          <Handle
            id="right"
            type="source"
            position={Position.Right}
            style={handleStyle}
          />
        </>
      )}
    </div>
  );
};

const nodeTypes = {
  default: TraceNode,
  input: TraceNode,
  output: TraceNode,
  iteration: TraceNode,
};

const edgeTypes: EdgeTypes = {
  return: ReturnEdge,
};

function mapNodes(nodes: GraphNode[]): Node[] {
  return nodes.map((n, idx) => {
    const rawLabel = n.data?.label ?? "";
    // Limpiar el "→ valor" del label: ese valor se mostrará en la arista de retorno
    const label = rawLabel.replace(/\n→\s*.+$/s, "").trim();
    const isReturn = /return|retorna/i.test(label);
    // No ocultar los nodos de retorno, solo identificarlos para darles estilo especial
    const isReturnNode = /^(RETURN|Retorna)(\s|$)/i.test(label.trim());
    const offsetY = idx % 2 === 0 ? -10 : 10;
    return {
      id: n.id,
      type: n.type || "default",
      position: {
        x: n.position.x,
        y: n.position.y + offsetY,
      },
      data: {
        label,
        isReturn: isReturn || isReturnNode,
        type: n.type || "default",
        microseconds: n.data?.microseconds,
        tokens: n.data?.tokens,
        iterationPath: n.data?.iterationPath,
      },
      parentNode: n.parentId,
      // NO ocultar - ReactFlow oculta también las aristas conectadas
    };
  });
}

function mapEdges(
  edges: GraphEdge[],
  nodeIndex: Map<string, GraphNode>,
  t: (key: string) => string,
): Edge[] {
  const multiplicity = new Map<string, number>();
  return edges.map((e) => {
    const key =
      e.source < e.target
        ? `${e.source}|${e.target}`
        : `${e.target}|${e.source}`;
    const count = multiplicity.get(key) ?? 0;
    multiplicity.set(key, count + 1);

    const edgeLabel = e.label || "";
    const translatedLabel =
      edgeLabel === "loop_start" ? t("loopEdgeStart") : edgeLabel;
    const isReturnEdge =
      e.type === "return" || e.label === "return" || e.id.startsWith("e_ret_");

    const sourceNode = nodeIndex.get(e.source);
    const targetNode = nodeIndex.get(e.target);
    let sourceHandle: string | undefined;
    let targetHandle: string | undefined;

    if (sourceNode && targetNode) {
      const dx = targetNode.position.x - sourceNode.position.x;
      const dy = targetNode.position.y - sourceNode.position.y;
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      const toRight = dx >= 0;
      const toBottom = dy >= 0;

      if (horizontal) {
        if (count === 0) {
          sourceHandle = toRight ? "right" : "left";
          targetHandle = toRight ? "left" : "right";
        } else if (count === 1) {
          sourceHandle = "top";
          targetHandle = "top";
        } else {
          sourceHandle = "bottom";
          targetHandle = "bottom";
        }
      } else {
        if (count === 0) {
          sourceHandle = toBottom ? "bottom" : "top";
          targetHandle = toBottom ? "top" : "bottom";
        } else if (count === 1) {
          sourceHandle = "right";
          targetHandle = "right";
        } else {
          sourceHandle = "left";
          targetHandle = "left";
        }
      }
    }

    const edgeStyle = isReturnEdge
      ? {
          stroke: "#10b981",
          strokeWidth: "2px",
        }
      : {
          stroke: "#94a3b8",
          strokeWidth: "1.5px",
        };

    let returnValue = "";
    if (isReturnEdge) {
      const sourceReturnValue = sourceNode?.data?.returnValue;
      if (sourceReturnValue !== undefined && sourceReturnValue !== null) {
        returnValue = String(sourceReturnValue);
      } else {
        const rawLabel = sourceNode?.data?.label ?? "";
        const returnMatch = /(?:\n|^)→\s*(.+?)(?:\n|$)/.exec(rawLabel);
        returnValue = returnMatch?.[1]?.trim() ?? "";
      }
    }

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: translatedLabel,
      type: isReturnEdge ? "return" : "smoothstep",
      sourceHandle,
      targetHandle,
      style: edgeStyle,
      data: isReturnEdge
        ? {
            returnValue,
          }
        : undefined,
      labelStyle: {
        fill: isReturnEdge ? "#6ee7b7" : "#e5e7eb",
        fontSize: 11,
        fontWeight: 500,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isReturnEdge ? "#10b981" : "#94a3b8",
      },
      pathOptions: {
        offset: 20,
        borderRadius: 12,
      },
      className: isReturnEdge ? "return-edge" : "call-edge",
    } as Edge;
  });
}

export default function ExecutionGraphView({
  graph,
  visibleNodeIds,
  visibleEdgeIds,
  currentNodeId,
}: ExecutionGraphViewProps) {
  const t = useTranslations("analyzer.executionTrace");
  const layoutedGraph = useMemo(
    () => getLayoutedGraph(graph, { direction: "LR" }),
    [graph],
  );

  const nodeIndex = useMemo(
    () =>
      new Map<string, GraphNode>(
        (layoutedGraph.nodes ?? []).map((n) => [n.id, n]),
      ),
    [layoutedGraph.nodes],
  );

  const initialNodes = useMemo(
    () => mapNodes(layoutedGraph.nodes ?? []),
    [layoutedGraph.nodes],
  );
  const initialEdges = useMemo(() => {
    const originalEdges = layoutedGraph.edges ?? [];
    return mapEdges(originalEdges, nodeIndex, t);
  }, [layoutedGraph.edges, nodeIndex, t]);

  // Filter nodes and highlight current node if stepping is active
  const steppingNodes = useMemo(() => {
    if (!visibleNodeIds) {
      return initialNodes;
    }
    return initialNodes.map((n) => ({
      ...n,
      style: {
        ...n.style,
        opacity: visibleNodeIds.has(n.id) ? 1 : 0,
        // Use a subtle blue glow for the currently focused node instead of changing
        // the background/box behind it. This avoids rectangular blue artifacts.
        boxShadow:
          n.id === currentNodeId
            ? "0 0 0 3px rgba(59,130,246,0.12)"
            : n.style?.boxShadow,
      },
      hidden: !visibleNodeIds.has(n.id),
    }));
  }, [initialNodes, visibleNodeIds, currentNodeId]);

  // Filter edges to only show connections between visible nodes
  const steppingEdges = useMemo(() => {
    if (!visibleNodeIds && !visibleEdgeIds) {
      return initialEdges;
    }

    const isReturnEdge = (edge: Edge): boolean => {
      return (
        edge.type === "return" ||
        edge.className === "return-edge" ||
        edge.id.startsWith("e_ret_")
      );
    };

    // Return edges must follow the stepper exactly.
    // Call edges may fall back to node visibility if the edge set arrives empty.
    if (visibleEdgeIds && visibleEdgeIds.size > 0) {
      const filtered = initialEdges.filter((edge) =>
        visibleEdgeIds.has(edge.id),
      );
      if (filtered.length > 0) {
        return filtered;
      }
    }

    return initialEdges.filter((e) => {
      if (isReturnEdge(e)) {
        return visibleEdgeIds ? visibleEdgeIds.has(e.id) : false;
      }

      return visibleNodeIds
        ? visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
        : true;
    });
  }, [initialEdges, visibleNodeIds, visibleEdgeIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(steppingNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(steppingEdges);

  useEffect(() => {
    setNodes(steppingNodes);
    setEdges(steppingEdges);
  }, [steppingNodes, steppingEdges, setNodes, setEdges]);

  const hasEdges = edges.length > 0;

  if (
    !layoutedGraph ||
    !layoutedGraph.nodes ||
    layoutedGraph.nodes.length === 0
  ) {
    return (
      <div className="text-slate-400 text-sm p-4 text-center">
        {t("noGraphFromTrace")}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-950 recursion-tree-container overflow-hidden rounded-lg border border-slate-800/70">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.35, minZoom: 0.3, maxZoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        minZoom={0.15}
        maxZoom={2}
      >
        <Background color="#334155" gap={16} size={1} />
        <Controls
          className="!bg-slate-800/90 !border !border-white/10 !rounded-lg"
          showZoom
          showFitView
          showInteractive
        />
        {!hasEdges && (
          <div className="absolute top-2 right-3 px-2 py-1 rounded bg-slate-700/80 border border-slate-600/60 text-[10px] text-slate-300 font-medium shadow flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px] leading-none">
              info
            </span>
            {t("graphNoEdges")}
          </div>
        )}
      </ReactFlow>
    </div>
  );
}
