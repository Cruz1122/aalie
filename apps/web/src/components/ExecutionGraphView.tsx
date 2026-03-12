"use client";

import { useTranslations } from "next-intl";
import React, { useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Edge,
  type Node,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import { getLayoutedGraph } from "@/lib/layout/traceGraphLayout";
import type { TraceGraph, GraphNode, GraphEdge } from "@/types/trace";

interface ExecutionGraphViewProps {
  readonly graph: TraceGraph;
}

const TraceNode = ({ data }: { data: { label: string; isReturn?: boolean; type?: string; microseconds?: number; tokens?: number } }) => {
  const isReturn = data.isReturn || false;
  const type = data.type || "default";
  const firstLine = (data.label || "").split("\n")[0]?.trim();
  const isFin = firstLine ? /^FIN$/i.test(firstLine) : false;
  const hasCosts = data.microseconds !== undefined || data.tokens !== undefined;

  let borderColor = "border-slate-600/70";
  let bgColor = "bg-slate-800/80";
  let shadowColor = "shadow-sky-500/10";

  if (type === "input") {
    borderColor = "border-blue-500/70";
    bgColor = "bg-blue-900/30";
    shadowColor = "shadow-blue-500/20";
  } else if (type === "output" || isFin) {
    borderColor = "border-green-500/70";
    bgColor = "bg-green-900/30";
    shadowColor = "shadow-green-500/20";
  } else if (isReturn) {
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

  const formatMicroseconds = (microseconds: number): string => {
    if (microseconds < 1) {
      return `${(microseconds * 1000).toFixed(2)} ns`;
    } else if (microseconds < 1000) {
      return `${microseconds.toFixed(2)} μs`;
    } else if (microseconds < 1000000) {
      return `${(microseconds / 1000).toFixed(2)} ms`;
    } else {
      return `${(microseconds / 1000000).toFixed(2)} s`;
    }
  };

  return (
    <div className={`relative rounded-lg border ${borderColor} ${bgColor} text-slate-50 text-sm sm:text-base px-5 py-3 shadow-md ${shadowColor} backdrop-blur-sm min-w-[240px] max-w-[500px]`}>
      {type !== "input" && (
        <>
          <Handle id="top" type="target" position={Position.Top} style={handleStyle} />
          <Handle id="bottom" type="target" position={Position.Bottom} style={handleStyle} />
          <Handle id="left" type="target" position={Position.Left} style={handleStyle} />
          <Handle id="right" type="target" position={Position.Right} style={handleStyle} />
        </>
      )}
      <div className="text-center px-1 font-medium whitespace-pre-line leading-snug">
        {data.label}
      </div>
      {hasCosts && (
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-center gap-3 text-xs">
          {data.microseconds !== undefined && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/20 border border-green-500/40">
              <span className="material-symbols-outlined text-green-300 text-sm leading-none">schedule</span>
              <span className="text-green-200 font-medium">{formatMicroseconds(data.microseconds)}</span>
            </div>
          )}
          {data.tokens !== undefined && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-500/20 border border-cyan-500/40">
              <span className="material-symbols-outlined text-cyan-300 text-sm leading-none">calculate</span>
              <span className="text-cyan-200 font-medium">{data.tokens}</span>
            </div>
          )}
        </div>
      )}
      {type !== "output" && (
        <>
          <Handle id="top" type="source" position={Position.Top} style={handleStyle} />
          <Handle id="bottom" type="source" position={Position.Bottom} style={handleStyle} />
          <Handle id="left" type="source" position={Position.Left} style={handleStyle} />
          <Handle id="right" type="source" position={Position.Right} style={handleStyle} />
        </>
      )}
    </div>
  );
};

const nodeTypes = {
  default: TraceNode,
  input: TraceNode,
  output: TraceNode,
};

function mapNodes(nodes: GraphNode[]): Node[] {
  return nodes.map((n) => {
    const label = n.data?.label ?? "";
    const isReturn = /return/i.test(label);
    return {
      id: n.id,
      type: n.type || "default",
      position: n.position,
      data: {
        label,
        isReturn,
        type: n.type || "default",
        microseconds: n.data?.microseconds,
        tokens: n.data?.tokens,
      },
      parentNode: n.parentId,
    };
  });
}

function mapEdges(
  edges: GraphEdge[],
  nodeIndex: Map<string, GraphNode>,
): Edge[] {
  const multiplicity = new Map<string, number>();
  return edges.map((e) => {
    const key = e.source < e.target ? `${e.source}|${e.target}` : `${e.target}|${e.source}`;
    const count = multiplicity.get(key) ?? 0;
    multiplicity.set(key, count + 1);

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

    const isReturnEdge = e.label && (/return/i.test(e.label) || /→/i.test(e.label) || /retorna/i.test(e.label));
    const edgeStyle = {
      stroke: isReturnEdge ? "#10b981" : "#94a3b8",
      strokeWidth: isReturnEdge ? "2.5px" : "1.5px",
    };

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: "default",
      sourceHandle,
      targetHandle,
      style: edgeStyle,
      labelStyle: {
        fill: isReturnEdge ? "#6ee7b7" : "#e5e7eb",
        fontSize: isReturnEdge ? 12 : 11,
        fontWeight: isReturnEdge ? 600 : 500,
      },
      markerEnd: {
        type: "arrow" as const,
        color: isReturnEdge ? "#10b981" : "#94a3b8",
      },
      className: isReturnEdge ? "return-edge" : "",
    } as Edge;
  });
}

export default function ExecutionGraphView({ graph }: ExecutionGraphViewProps) {
  const t = useTranslations("analyzer.executionTrace");
  const layoutedGraph = useMemo(
    () => getLayoutedGraph(graph, { direction: "TB" }),
    [graph],
  );

  const nodeIndex = useMemo(
    () => new Map<string, GraphNode>((layoutedGraph.nodes ?? []).map((n) => [n.id, n])),
    [layoutedGraph.nodes],
  );

  const initialNodes = useMemo(() => mapNodes(layoutedGraph.nodes ?? []), [layoutedGraph.nodes]);
  const initialEdges = useMemo(
    () => mapEdges(layoutedGraph.edges ?? [], nodeIndex),
    [layoutedGraph.edges, nodeIndex],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const hasEdges = edges.length > 0;

  if (!layoutedGraph || !layoutedGraph.nodes || layoutedGraph.nodes.length === 0) {
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
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        edgesUpdatable={false}
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
          <div className="absolute top-2 right-3 px-2 py-1 rounded bg-red-500/80 text-[10px] text-white font-semibold shadow">
            {t("graphNoEdges")}
          </div>
        )}
      </ReactFlow>
    </div>
  );
}
