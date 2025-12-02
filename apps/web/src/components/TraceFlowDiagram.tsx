"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

import type { TraceGraph, GraphNode, GraphEdge } from "@/types/trace";
import { getLayoutedGraph } from "@/lib/layout/traceGraphLayout";

interface TraceFlowDiagramProps {
  readonly graph: TraceGraph;
}

const TraceNode = ({ data }: { data: { label: string; isReturn?: boolean } }) => {
  const isReturn = data.isReturn || false;
  const borderColor = isReturn ? "border-green-500/70" : "border-slate-600/70";
  const bgColor = isReturn ? "bg-green-900/30" : "bg-slate-800/80";
  const shadowColor = isReturn ? "shadow-green-500/20" : "shadow-sky-500/10";

  return (
    <div className={`relative rounded-lg border ${borderColor} ${bgColor} text-slate-50 text-xs px-3 py-2 shadow-md ${shadowColor} backdrop-blur-sm max-w-[220px]`}>
      {/* Handles de entrada (target) en los cuatro lados */}
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={{
          background: "#38bdf8",
          width: 8,
          height: 8,
          border: "2px solid #0f172a",
        }}
      />
      <Handle
        id="bottom"
        type="target"
        position={Position.Bottom}
        style={{
          background: "#38bdf8",
          width: 8,
          height: 8,
          border: "2px solid #0f172a",
        }}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        style={{
          background: "#38bdf8",
          width: 8,
          height: 8,
          border: "2px solid #0f172a",
        }}
      />
      <Handle
        id="right"
        type="target"
        position={Position.Right}
        style={{
          background: "#38bdf8",
          width: 8,
          height: 8,
          border: "2px solid #0f172a",
        }}
      />

      {/* Contenido */}
      <span className="block truncate text-center px-1">{data.label}</span>

      {/* Handles de salida (source) en los cuatro lados */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        style={{
          background: "#38bdf8",
          width: 8,
          height: 8,
          border: "2px solid #0f172a",
        }}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={{
          background: "#38bdf8",
          width: 8,
          height: 8,
          border: "2px solid #0f172a",
        }}
      />
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        style={{
          background: "#38bdf8",
          width: 8,
          height: 8,
          border: "2px solid #0f172a",
        }}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={{
          background: "#38bdf8",
          width: 8,
          height: 8,
          border: "2px solid #0f172a",
        }}
      />
    </div>
  );
};

const nodeTypes = {
  default: TraceNode,
};

function mapNodes(nodes: GraphNode[]): Node[] {
  return nodes.map((n) => {
    const label = n.data?.label ?? "";
    const isReturn = /return/i.test(label);

    return {
      id: n.id,
      type: n.type || "default",
      position: n.position,
      data: { label, isReturn },
      parentNode: n.parentId,
    };
  });
}

function mapEdges(
  edges: GraphEdge[],
  nodeIndex: Map<string, GraphNode>,
): Edge[] {
  // Contador por par (source-target) para distinguir aristas múltiples
  const multiplicity = new Map<string, number>();

  return edges.map((e) => {
    // Agrupar por par NO direccionado (source-target y target-source juntos)
    const key =
      e.source < e.target
        ? `${e.source}|${e.target}`
        : `${e.target}|${e.source}`;
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

      // Para aristas múltiples entre el mismo par de nodos,
      // alternamos los lados para reducir solapamientos visibles.
      if (horizontal) {
        // Conexiones principalmente horizontales
        const toRight = dx >= 0;

        if (count === 0) {
          // Primera arista: derecha -> izquierda
          sourceHandle = toRight ? "right" : "left";
          targetHandle = toRight ? "left" : "right";
        } else if (count === 1) {
          // Segunda arista: abajo -> arriba
          sourceHandle = "bottom";
          targetHandle = "top";
        } else {
          // Resto: arriba -> abajo
          sourceHandle = "top";
          targetHandle = "bottom";
        }
      } else {
        // Conexiones principalmente verticales
        const toBottom = dy >= 0;

        if (count === 0) {
          // Primera arista: abajo -> arriba
          sourceHandle = toBottom ? "bottom" : "top";
          targetHandle = toBottom ? "top" : "bottom";
        } else if (count === 1) {
          // Segunda arista: derecha -> izquierda
          sourceHandle = "right";
          targetHandle = "left";
        } else {
          // Resto: izquierda -> derecha
          sourceHandle = "left";
          targetHandle = "right";
        }
      }
    }

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      sourceHandle,
      targetHandle,
      // El tipo se hereda de defaultEdgeOptions (smoothstep)
    };
  });
}

export default function TraceFlowDiagram({ graph }: TraceFlowDiagramProps) {
  const layoutedGraph = useMemo(
    () => getLayoutedGraph(graph, { direction: "TB" }),
    [graph],
  );

  const nodeIndex = useMemo(
    () =>
      new Map<string, GraphNode>(
        (layoutedGraph.nodes ?? []).map((n) => [n.id, n]),
      ),
    [layoutedGraph.nodes],
  );

  const nodes = useMemo(
    () => mapNodes(layoutedGraph.nodes ?? []),
    [layoutedGraph.nodes],
  );
  const edges = useMemo(
    () => mapEdges(layoutedGraph.edges ?? [], nodeIndex),
    [layoutedGraph.edges, nodeIndex],
  );
  const hasEdges = edges.length > 0;

  if (!layoutedGraph || !layoutedGraph.nodes || layoutedGraph.nodes.length === 0) {
    return (
      <div className="text-slate-400 text-sm p-4 text-center">
        No se pudo generar un grafo a partir del rastro.
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-950 recursion-tree-container overflow-hidden rounded-lg border border-slate-800/70">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          // Usar bezier para mejor enrutamiento automático
          type: "default",
          style: {
            stroke: "#94a3b8",
            strokeWidth: 1.5,
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
        panOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        minZoom={0.2}
        maxZoom={1.5}
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
            El grafo recibido no contiene aristas
          </div>
        )}
      </ReactFlow>
    </div>
  );
}

