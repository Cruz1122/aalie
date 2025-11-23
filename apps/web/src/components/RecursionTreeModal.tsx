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

import { 
  generateRecursionTree, 
  generateLinearRecursionTree,
  type RecurrenceData,
  type LinearRecurrenceData
} from "@/lib/recursion-tree-generator";
import Formula from "./Formula";

interface RecursionTreeModalProps {
  open: boolean;
  onClose: () => void;
  recurrence: (
    | {
        type: "divide_conquer";
    a: number;
    b: number;
    f: string;
    n0: number;
      }
    | {
        type: "linear_shift";
        shifts: number[];
        coefficients: number[];
        "g(n)"?: string;
        n0: number;
      }
  ) | null | undefined;
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
  characteristicEquation?: {
    method: "characteristic_equation";
    equation?: string;
    roots?: Array<{ root: string; multiplicity: number }>;
    growth_rate?: number;
    theta?: string;
  } | null | undefined;
}

interface TreeNodeData {
  label: string;
  size: number;
  level: number;
  nodeCount: number;
  isBaseCase: boolean;
  duplicateCount?: number; // número de veces que aparece este subproblema (para árboles lineales)
  argument?: number; // valor del argumento (para árboles lineales)
}

/**
 * Nodo personalizado para el árbol de recursión.
 * Renderiza cada nodo con su tamaño, nivel y costo.
 * 
 * @param data - Datos del nodo del árbol
 * @returns Componente React del nodo
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const TreeNode = React.memo(({ data }: { data: TreeNodeData & { sourcePosition?: string; targetPosition?: string } }) => {
  const { label, size, level, nodeCount, isBaseCase, duplicateCount, argument, sourcePosition, targetPosition } = data;
  
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
        {argument !== undefined ? (
          <div className="font-medium">n = {argument}</div>
        ) : (
        <div className="font-medium">n ≈ {size.toFixed(1)}</div>
        )}
        <div className="text-slate-400">Nivel {level}</div>
        {duplicateCount && duplicateCount > 1 ? (
          <div className="text-orange-400 font-semibold text-[10px] bg-orange-500/20 px-1.5 py-0.5 rounded">
            ⚠ Subproblema duplicado ({duplicateCount}x)
          </div>
        ) : (
        <div className={`text-xs ${isBaseCase ? "text-green-400" : "text-slate-500"}`}>
          {nodeCount} nodo{nodeCount !== 1 ? "s" : ""}
        </div>
        )}
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

/**
 * Modal para visualizar el árbol de recursión de un algoritmo recursivo.
 * Muestra una visualización interactiva usando React Flow con nodos y conexiones
 * que representan las llamadas recursivas y sus subproblemas.
 * 
 * @param props - Propiedades del modal
 * @returns Componente React del modal o null si está cerrado
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * 
 * @example
 * ```tsx
 * <RecursionTreeModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   recurrence={recurrence}
 *   recursionTreeData={recursionTreeData}
 *   characteristicEquation={characteristicEquation}
 * />
 * ```
 */
export default function RecursionTreeModal({
  open,
  onClose,
  recurrence,
  recursionTreeData,
  characteristicEquation,
}: Readonly<RecursionTreeModalProps>) {
  const [maxDepth, setMaxDepth] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [initialN, setInitialN] = useState<number>(3); // Por defecto n=3 (profundidad más baja)
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  
  // Detectar tipo de recurrencia
  const isLinearRecurrence = recurrence?.type === "linear_shift";
  const isDivideConquer = recurrence?.type === "divide_conquer";

  // Calcular profundidad base si no está configurada
  useEffect(() => {
    if (recurrence && maxDepth === null) {
      if (isLinearRecurrence) {
        // Para recurrencias lineales, la profundidad es aproximadamente n
        // Limitamos a un máximo razonable para evitar explosión
        const depth = Math.min(initialN, 10); // Máximo 10 niveles para árboles lineales
        setMaxDepth(depth);
      } else if (isDivideConquer) {
        // Para divide-and-conquer, calcular hasta caso base
      let depth = 0;
      let currentN = initialN;
      while (currentN > recurrence.n0 && recurrence.b > 1) {
        currentN = currentN / recurrence.b;
        depth++;
      }
      setMaxDepth(depth);
    }
    }
  }, [recurrence, maxDepth, initialN, isLinearRecurrence, isDivideConquer]);
  
  // Ajustar initialN por defecto según el tipo de recurrencia solo al cargar
  useEffect(() => {
    // No cambiar automáticamente si el usuario ya lo modificó
    // Solo establecer valor por defecto inicial
    if (initialN === 3) {
      // Mantener n=3 como valor por defecto para ambos tipos
      // El usuario puede cambiarlo si lo desea
    }
  }, [isLinearRecurrence, isDivideConquer, initialN]);

  // Generar árbol cuando cambian los parámetros
  useEffect(() => {
    if (!recurrence) {
      setNodes([]);
      setEdges([]);
      return;
    }

    let fitViewTimeout: ReturnType<typeof setTimeout> | null = null;

    try {
      let treeLayout;
      
      if (isLinearRecurrence) {
        // Generar árbol lineal (irregular) para ecuación característica
        if (maxDepth === null) {
          setNodes([]);
          setEdges([]);
          return;
        }
        
        treeLayout = generateLinearRecursionTree(
          {
            shifts: recurrence.shifts,
            coefficients: recurrence.coefficients,
            g_n: recurrence["g(n)"],
            n0: recurrence.n0,
          } as LinearRecurrenceData,
        maxDepth,
        orientation,
        initialN
      );
      } else if (isDivideConquer) {
        // Generar árbol divide-and-conquer (uniforme)
        if (maxDepth === null) {
          setNodes([]);
          setEdges([]);
          return;
        }
        
        // Validar que b > 1 para que sea una recurrencia divide-and-conquer válida
        if (recurrence.b <= 1 || recurrence.a <= 0) {
          console.warn('[RecursionTreeModal] Invalid recurrence parameters for divide-and-conquer tree:', recurrence);
          setNodes([]);
          setEdges([]);
          return;
        }
        
        treeLayout = generateRecursionTree(
          {
            a: recurrence.a,
            b: recurrence.b,
            f: recurrence.f,
            n0: recurrence.n0,
          } as RecurrenceData,
          maxDepth,
          orientation,
          initialN
        );
      } else {
        // Tipo de recurrencia no soportado
        setNodes([]);
        setEdges([]);
        return;
      }

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
      
      // Verificar que todos los source y target existen
      const nodeIdSet = new Set(formattedNodes.map(n => n.id));
      const invalidEdges = formattedEdges.filter(e => 
        !nodeIdSet.has(e.source) || !nodeIdSet.has(e.target)
      );
      if (invalidEdges.length > 0) {
        console.error('[RecursionTree] Invalid edges detected:', invalidEdges);
        // Filtrar edges inválidos
        const validEdges = formattedEdges.filter(e => 
          nodeIdSet.has(e.source) && nodeIdSet.has(e.target)
        );
        setNodes(formattedNodes);
        setEdges(validEdges);
      } else {
        setNodes(formattedNodes);
        setEdges(formattedEdges);
      }
      
      // Ajustar vista después de que los nodos y edges se hayan renderizado
      // Esperar a que React Flow esté completamente inicializado
      fitViewTimeout = setTimeout(() => {
        if (reactFlowInstance.current && formattedNodes.length > 0) {
          try {
            reactFlowInstance.current.fitView({ 
              padding: 0.2, 
              duration: 300,
              maxZoom: 1,
              minZoom: 0.1
            });
          } catch (error) {
            console.warn('[RecursionTree] Error fitting view:', error);
          }
        }
      }, 250);
    } catch (error) {
      console.error("Error generando árbol:", error);
    }

    // Retornar función de limpieza para el timeout
    return () => {
      if (fitViewTimeout) {
        clearTimeout(fitViewTimeout);
      }
    };
  }, [recurrence, maxDepth, orientation, initialN, setNodes, setEdges, isLinearRecurrence, isDivideConquer]);

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
    
    if (isLinearRecurrence) {
      // Para recurrencias lineales, la profundidad máxima es aproximadamente n
      // Limitamos a un máximo razonable para evitar explosión
      return Math.min(initialN, 10);
    } else if (isDivideConquer) {
      // Para divide-and-conquer, calcular hasta caso base
    let depth = 0;
    let currentN = initialN;
    while (currentN > recurrence.n0 && recurrence.b > 1) {
      currentN = currentN / recurrence.b;
      depth++;
    }
    return depth;
    }
    
    return 0;
  }, [recurrence, initialN, isLinearRecurrence, isDivideConquer]);

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

  // Solo mostrar el modal si la recurrencia es válida
  if (!open || !recurrence) {
    return null;
  }
  
  // Validar tipo de recurrencia
  if (isLinearRecurrence) {
    // Para recurrencias lineales, validar que tenga shifts y coefficients
    if (!recurrence.shifts || recurrence.shifts.length === 0 || !recurrence.coefficients || recurrence.coefficients.length === 0) {
      return null;
    }
  } else if (isDivideConquer) {
    // Para divide-and-conquer, validar que tenga a y b válidos
    if (!('a' in recurrence) || !('b' in recurrence) || recurrence.b <= 1 || recurrence.a <= 0) {
      return null;
    }
  } else {
    // Tipo de recurrencia no soportado
    return null;
  }

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
                  min="3"
                  max={isLinearRecurrence ? "10" : "100"}
                  step="1"
                  value={initialN}
                  onChange={(e) => {
                    const newN = parseInt(e.target.value);
                    setInitialN(newN);
                    // Recalcular profundidad cuando cambia n
                    if (recurrence) {
                      if (isLinearRecurrence) {
                        // Para árboles lineales, profundidad ≈ n
                        setMaxDepth(Math.min(newN, 10));
                      } else if (isDivideConquer) {
                      let depth = 0;
                      let currentN = newN;
                      while (currentN > recurrence.n0 && recurrence.b > 1) {
                        currentN = currentN / recurrence.b;
                        depth++;
                      }
                      setMaxDepth(depth);
                      }
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
              {isLinearRecurrence ? (
                <>
                  <span>Desplazamientos: [{recurrence.shifts.join(', ')}]</span>
                  <span>,</span>
                  <span>Coefs: [{recurrence.coefficients.join(', ')}]</span>
                  {characteristicEquation?.growth_rate && (
                    <>
                      <span>,</span>
                      <span className="text-orange-300">
                        Crecimiento: ≈{characteristicEquation.growth_rate.toFixed(3)}ⁿ
                      </span>
                    </>
                  )}
                </>
              ) : isDivideConquer ? (
                <>
              <Formula latex={`a = ${recurrence.a}`} />
              <span>,</span>
              <Formula latex={`b = ${recurrence.b}`} />
              <span>,</span>
              <Formula latex={`f(n) = ${recurrence.f}`} />
                </>
              ) : null}
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
            fitView={false}
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
                <div className="flex items-center gap-4 flex-wrap">
                  <span>
                    Total de nodos: <span className="text-white font-semibold">{nodes.length}</span>
                  </span>
                  <span>
                    Niveles:{" "}
                    <span className="text-white font-semibold">
                      {Math.max(...nodes.map((n) => n.data?.level || 0)) + 1}
                    </span>
                  </span>
                  {isLinearRecurrence && (
                    <>
                      <span>
                        Subproblemas duplicados:{" "}
                        <span className="text-orange-300 font-semibold">
                          {nodes.filter(n => n.data?.duplicateCount && n.data.duplicateCount > 1).length}
                        </span>
                      </span>
                      {characteristicEquation?.growth_rate && (
                        <span className="text-orange-300">
                          Crecimiento: Θ({characteristicEquation.growth_rate.toFixed(3)}ⁿ)
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="text-slate-500 flex items-center gap-2">
                  <span>Usa el mouse para hacer zoom y arrastrar. Presiona Esc para cerrar.</span>
                  {isLinearRecurrence && (
                    <span className="text-orange-400 text-[10px]">
                      ⚠ Árbol irregular: los nodos se duplican
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
