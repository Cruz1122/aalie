"use client";

import React, { useMemo, useEffect } from "react";
import ReactFlow, {
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

import type { TraceGraph, GraphNode, GraphEdge } from "@/types/trace";
import { getLayoutedGraph } from "@/lib/layout/traceGraphLayout";

interface TraceFlowDiagramProps {
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
    // Blue/Greenish for input
    borderColor = "border-blue-500/70";
    bgColor = "bg-blue-900/30";
    shadowColor = "shadow-blue-500/20";
  } else if (type === "output" || isFin) {
    // Green for output/FIN
    borderColor = "border-green-500/70";
    bgColor = "bg-green-900/30";
    shadowColor = "shadow-green-500/20";
  } else if (isReturn) {
    // Green for return statements
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

  // Helper function to format microseconds
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
    <div className={`relative rounded-lg border ${borderColor} ${bgColor} text-slate-50 text-base px-6 py-4 shadow-md ${shadowColor} backdrop-blur-sm min-w-[280px] max-w-[600px]`}>
      {/* Handles de entrada (target) en los cuatro lados */}
      {type !== "input" && (
        <>
          <Handle id="top" type="target" position={Position.Top} style={handleStyle} />
          <Handle id="bottom" type="target" position={Position.Bottom} style={handleStyle} />
          <Handle id="left" type="target" position={Position.Left} style={handleStyle} />
          <Handle id="right" type="target" position={Position.Right} style={handleStyle} />
        </>
      )}

      {/* Contenido */}
      <div className="text-center px-1 font-medium whitespace-pre-line leading-snug">
        {data.label}
      </div>

      {/* Costes (microsegundos y tokens) */}
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

      {/* Handles de salida (source) en los cuatro lados */}
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
          // Primera arista: sale por el lado hacia el target, entra por el lado opuesto
          sourceHandle = toRight ? "right" : "left";
          targetHandle = toRight ? "left" : "right";
        } else if (count === 1) {
          // Segunda arista: vertical superior
          sourceHandle = "top";
          targetHandle = "top";
        } else {
          // Resto: vertical inferior
          sourceHandle = "bottom";
          targetHandle = "bottom";
        }
      } else {
        // Conexiones principalmente verticales
        const toBottom = dy >= 0;

        if (count === 0) {
          // Primera arista: sale por arriba/abajo hacia el target, entra por el lado opuesto
          sourceHandle = toBottom ? "bottom" : "top";
          targetHandle = toBottom ? "top" : "bottom";
        } else if (count === 1) {
          // Segunda arista: horizontal derecha
          sourceHandle = "right";
          targetHandle = "right";
        } else {
          // Resto: horizontal izquierda
          sourceHandle = "left";
          targetHandle = "left";
        }
      }
    }

    // Detectar si es una arista de retorno por el label
    const isReturnEdge = e.label && (/return/i.test(e.label) || /→/i.test(e.label) || /retorna/i.test(e.label));
    
    console.log(`Edge ${e.id}: label="${e.label}", isReturn=${isReturnEdge}`);

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
      // Estilo específico para aristas de retorno
      style: edgeStyle as any,
      labelStyle: {
        fill: isReturnEdge ? "#6ee7b7" : "#e5e7eb",
        fontSize: isReturnEdge ? 12 : 11,
        fontWeight: isReturnEdge ? 600 : 500,
      },
      markerEnd: {
        type: "arrowclosed" as const,
        color: isReturnEdge ? "#10b981" : "#94a3b8",
      },
      className: isReturnEdge ? "return-edge" : "",
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

  const initialNodes = useMemo(
    () => mapNodes(layoutedGraph.nodes ?? []),
    [layoutedGraph.nodes],
  );

  const initialEdges = useMemo(
    () => mapEdges(layoutedGraph.edges ?? [], nodeIndex),
    [layoutedGraph.edges, nodeIndex],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when graph changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.25 }}
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

