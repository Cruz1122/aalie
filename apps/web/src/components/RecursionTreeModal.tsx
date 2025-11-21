"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  BaseEdge,
  getStraightPath,
  type Node,
  type Edge,
  type EdgeProps,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import { generateRecursionTree, type RecurrenceData } from "@/lib/recursion-tree-generator";
import Formula from "./Formula";

interface RecursionTreeModalProps {
  open: boolean;
  onClose: () => void;
  recurrence: {
    a: number;
    b: number;
    f: string;
    n0: number;
  } | null | undefined;
  recursionTreeData?: {
    method: "recursion_tree";
    levels?: Array<{
      level: number;
      num_nodes: number;
      num_nodes_latex: string;
      subproblem_size_latex: string;
      cost_per_node_latex: string;
      total_cost_latex: string;
    }>;
    height?: string;
    theta?: string;
  } | null | undefined;
}

interface TreeNodeData {
  label: string;
  size: number;
  level: number;
  nodeCount: number;
  isBaseCase: boolean;
}

// Nodo personalizado para el árbol - optimizado con React.memo
const TreeNode = React.memo(({ data }: { data: TreeNodeData & { sourcePosition?: string; targetPosition?: string } }) => {
  const { label, size, level, nodeCount, isBaseCase, sourcePosition, targetPosition } = data;
  
  // Convertir strings a Position enum
  const sourcePos = sourcePosition === 'bottom' ? Position.Bottom : 
                    sourcePosition === 'right' ? Position.Right :
                    sourcePosition === 'top' ? Position.Top :
                    sourcePosition === 'left' ? Position.Left : Position.Bottom;
  
  const targetPos = targetPosition === 'top' ? Position.Top :
                    targetPosition === 'left' ? Position.Left :
                    targetPosition === 'bottom' ? Position.Bottom :
                    targetPosition === 'right' ? Position.Right : Position.Top;
  
  return (
    <div
      style={{ 
        background: isBaseCase 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))'
          : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
      }}
      className={`rounded-lg border-2 p-3 min-w-[160px] max-w-[180px] text-center transition-all duration-200 relative ${
        isBaseCase
          ? "border-green-500/50 shadow-lg shadow-green-500/20"
          : "border-white/20 shadow-md hover:border-purple-400/40 hover:shadow-xl hover:scale-105"
      }`}
    >
      {/* Handles para conectar aristas - siempre visibles */}
      <Handle
        type="source"
        position={sourcePos}
        style={{ 
          background: '#64748b',
          width: 8,
          height: 8,
          border: '2px solid #475569',
        }}
      />
      <Handle
        type="target"
        position={targetPos}
        style={{ 
          background: '#64748b',
          width: 8,
          height: 8,
          border: '2px solid #475569',
        }}
      />
      <div className="text-white font-semibold text-sm mb-2 truncate">{label}</div>
      <div className="text-xs text-slate-300 space-y-0.5">
        <div className="font-medium">n ≈ {size.toFixed(1)}</div>
        <div className="text-slate-400">Nivel {level}</div>
        <div className={`text-xs ${isBaseCase ? "text-green-400" : "text-slate-500"}`}>
          {nodeCount} nodo{nodeCount !== 1 ? "s" : ""}
        </div>
        {isBaseCase && (
          <div className="text-green-300 font-semibold mt-1 pt-1 border-t border-green-500/30">
            Retorna
          </div>
        )}
      </div>
    </div>
  );
});

TreeNode.displayName = "TreeNode";

// Componente de arista simple sin labels
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: EdgeProps) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return <BaseEdge id={id} path={edgePath} style={style} />;
}

// Memoizar nodeTypes para evitar recreaciones
const nodeTypes = {
  default: TreeNode,
};

// Memoizar edgeTypes
const edgeTypes = {
  default: CustomEdge,
};

export default function RecursionTreeModal({
  open,
  onClose,
  recurrence,
  recursionTreeData,
}: Readonly<RecursionTreeModalProps>) {
  const [maxDepth, setMaxDepth] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [initialN, setInitialN] = useState<number>(30);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Debug: verificar edges en cada render
  useEffect(() => {
    if (edges.length > 0) {
      console.log('[RecursionTreeModal] Current edges state:', edges.length, edges[0]);
    }
  }, [edges]);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Calcular profundidad base si no está configurada
  useEffect(() => {
    if (recurrence && maxDepth === null) {
      let depth = 0;
      let currentN = initialN;
      while (currentN > recurrence.n0 && recurrence.b > 1) {
        currentN = currentN / recurrence.b;
        depth++;
      }
      setMaxDepth(depth);
    }
  }, [recurrence, maxDepth, initialN]);

  // Generar árbol cuando cambian los parámetros
  useEffect(() => {
    if (!recurrence || maxDepth === null) return;

    try {
      const treeLayout = generateRecursionTree(
        recurrence as RecurrenceData,
        maxDepth,
        orientation,
        initialN
      );

      const formattedNodes = treeLayout.nodes as Node[];
      // Asegurar que las aristas tengan el formato mínimo requerido
      const formattedEdges: Edge[] = treeLayout.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'default',
        style: {
          stroke: '#64748b',
          strokeWidth: 2,
        },
      }));
      
      console.log('[RecursionTree] Setting nodes and edges:', {
        nodesCount: formattedNodes.length,
        edgesCount: formattedEdges.length,
        sampleEdge: formattedEdges[0],
        sampleEdgeLabel: formattedEdges[0]?.label,
        allEdgeLabels: formattedEdges.map(e => ({ id: e.id, label: e.label }))
      });
      
      setNodes(formattedNodes);
      setEdges(formattedEdges);
      
      console.log('[RecursionTree] Generated:', {
        nodes: formattedNodes.length,
        edges: formattedEdges.length,
        firstEdge: formattedEdges[0],
        firstNode: formattedNodes[0],
        nodeIds: formattedNodes.map(n => n.id),
        edgeSources: formattedEdges.map(e => e.source),
        edgeTargets: formattedEdges.map(e => e.target),
      });
      
      // Verificar que todos los source y target existen
      const nodeIdSet = new Set(formattedNodes.map(n => n.id));
      const invalidEdges = formattedEdges.filter(e => 
        !nodeIdSet.has(e.source) || !nodeIdSet.has(e.target)
      );
      if (invalidEdges.length > 0) {
        console.error('[RecursionTree] Invalid edges:', invalidEdges);
      }
      
      // Verificar posiciones de nodos
      const nodePositions = formattedNodes.map(n => ({
        id: n.id,
        x: n.position?.x || 0,
        y: n.position?.y || 0
      }));
      console.log('[RecursionTree] Node positions:', nodePositions);
      
      setTimeout(() => {
        if (reactFlowInstance.current) {
          reactFlowInstance.current.fitView({ padding: 0.2, duration: 300 });
          // Verificar que las aristas estén en el estado
          console.log('[RecursionTree] After fitView, edges count:', formattedEdges.length);
        }
      }, 100);
    } catch (error) {
      console.error("Error generando árbol:", error);
    }
  }, [recurrence, maxDepth, orientation, initialN, setNodes, setEdges]);

  // Manejar tecla Escape
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  const maxPossibleDepth = useMemo(() => {
    if (!recurrence) return 0;
    let depth = 0;
    let currentN = initialN;
    while (currentN > recurrence.n0 && recurrence.b > 1) {
      currentN = currentN / recurrence.b;
      depth++;
    }
    return depth;
  }, [recurrence, initialN]);

  const handleDepthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : parseInt(e.target.value);
    if (value === null || (value >= 1 && value <= maxPossibleDepth)) {
      setMaxDepth(value);
    }
  }, [maxPossibleDepth]);

  const toggleOrientation = useCallback(() => {
    setOrientation((prev) => prev === "vertical" ? "horizontal" : "vertical");
  }, []);

  const getNodeColor = useCallback((node: Node) => {
    return node.data?.isBaseCase ? "#10b981" : "#64748b";
  }, []);

  if (!open || !recurrence) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="Cerrar modal"
      />
       <div className="absolute left-1/2 top-1/2 w-[min(95vw,1600px)] h-[min(85vh,800px)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">account_tree</span>
            <span>Árbol de Recursión</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Controles de configuración */}
        <div className="border-b border-white/10 p-4 flex-shrink-0 bg-slate-800/50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Tamaño inicial n */}
            <div className="flex items-center gap-3 min-w-[220px]">
              <label className="text-sm text-slate-300 whitespace-nowrap font-medium">
                n inicial:
              </label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={initialN}
                  onChange={(e) => {
                    const newN = parseInt(e.target.value);
                    setInitialN(newN);
                    // Recalcular profundidad cuando cambia n
                    if (recurrence) {
                      let depth = 0;
                      let currentN = newN;
                      while (currentN > recurrence.n0 && recurrence.b > 1) {
                        currentN = currentN / recurrence.b;
                        depth++;
                      }
                      setMaxDepth(depth);
                    }
                  }}
                  className="flex-1 h-2 bg-slate-700/60 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:bg-slate-700/80 transition-colors"
                />
                <span className="text-sm text-white font-semibold min-w-[35px] text-right bg-slate-700/50 px-2 py-1 rounded border border-white/10">
                  {initialN}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300 whitespace-nowrap">
                Profundidad:
              </label>
              <input
                type="number"
                min="1"
                max={maxPossibleDepth}
                value={maxDepth || ""}
                onChange={handleDepthChange}
                className="w-20 px-2 py-1 rounded bg-slate-700 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                placeholder="Auto"
              />
              <span className="text-xs text-slate-400">
                / {maxPossibleDepth} (caso base)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300 whitespace-nowrap">
                Orientación:
              </label>
              <button
                onClick={toggleOrientation}
                className="flex items-center gap-2 px-3 py-1 rounded bg-slate-700 border border-white/10 text-white text-sm hover:bg-slate-600 transition-all duration-200 hover:shadow-lg"
                title={`Cambiar a orientación ${orientation === "vertical" ? "horizontal" : "vertical"}`}
              >
                <span className="text-base">{orientation === "vertical" ? "↓" : "→"}</span>
                <span>{orientation === "vertical" ? "Vertical" : "Horizontal"}</span>
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
              <Formula latex={`a = ${recurrence.a}`} />
              <span>,</span>
              <Formula latex={`b = ${recurrence.b}`} />
              <span>,</span>
              <Formula latex={`f(n) = ${recurrence.f}`} />
            </div>
          </div>
        </div>

        {/* Área del árbol */}
        <div className="flex-1 relative bg-slate-950 recursion-tree-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={onInit}
            fitView
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
              style: { 
                stroke: "#64748b", 
                strokeWidth: 3,
              },
              type: "default",
              animated: false,
            }}
            connectionLineStyle={{
              stroke: "#64748b",
              strokeWidth: 3,
            }}
            edgesUpdatable={false}
            edgesFocusable={false}
            nodesConnectable={false}
            nodesDraggable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background 
              color="#334155" 
              gap={16} 
              size={1}
            />
            <Controls 
              className="!bg-slate-800/90 !border !border-white/10 !rounded-lg"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
            <MiniMap
              className="!bg-slate-800/90 !border !border-white/10 !rounded-lg"
              nodeColor={getNodeColor}
              maskColor="rgba(0, 0, 0, 0.6)"
              pannable
              zoomable
            />
          </ReactFlow>
        </div>

        {/* Footer con información */}
        {nodes.length > 0 && (
          <div className="border-t border-white/10 p-3 flex-shrink-0 bg-slate-800/50">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span>
                    Total de nodos: <span className="text-white font-semibold">{nodes.length}</span>
                  </span>
                  <span>
                    Niveles:{" "}
                    <span className="text-white font-semibold">
                      {Math.max(...nodes.map((n) => n.data?.level || 0)) + 1}
                    </span>
                  </span>
                </div>
                <div className="text-slate-500">
                  Usa el mouse para hacer zoom y arrastrar. Presiona Esc para cerrar.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
