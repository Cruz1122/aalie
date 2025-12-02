"use client";

import React, { useMemo } from "react";
import ReactFlow, { Background, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";

import type { TraceGraph, GraphNode, GraphEdge } from "@/types/trace";

interface TraceFlowDiagramProps {
  readonly graph: TraceGraph;
}

const TraceNode = ({ data }: { data: { label: string } }) => {
  return (
    <div className="rounded-lg border border-slate-600/70 bg-slate-800/80 text-slate-50 text-xs px-3 py-2 shadow-md shadow-sky-500/10 backdrop-blur-sm max-w-[200px]">
      <span className="block truncate">{data.label}</span>
    </div>
  );
};

const nodeTypes = {
  default: TraceNode,
};

function mapNodes(nodes: GraphNode[]): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type || "default",
    position: n.position,
    data: { label: n.data?.label ?? "" },
    parentNode: n.parentId,
  }));
}

function mapEdges(edges: GraphEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: e.type || "default",
  }));
}

export default function TraceFlowDiagram({ graph }: TraceFlowDiagramProps) {
  const nodes = useMemo(() => mapNodes(graph?.nodes ?? []), [graph]);
  const edges = useMemo(() => mapEdges(graph?.edges ?? []), [graph]);

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="text-slate-400 text-sm p-4 text-center">
        No se pudo generar un grafo a partir del rastro.
      </div>
    );
  }

  return (
    <div className="w-full h-[360px] bg-slate-950 recursion-tree-container overflow-hidden rounded-lg border border-slate-800/70">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: "default",
          style: {
            stroke: "#38bdf8",
            strokeWidth: 2,
          },
          labelStyle: {
            fill: "#e5e7eb",
            fontSize: 11,
            fontWeight: 500,
          },
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        edgesUpdatable={false}
        edgesFocusable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
      >
        <Background color="#334155" gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}


