# Funcionamiento de React Flow

## Descripción General

React Flow es una biblioteca para crear diagramas de flujo interactivos y editables en React. En este proyecto, se utiliza principalmente para visualizar árboles de recursión y grafos de ejecución de algoritmos.

## Componentes Principales

### 1. TraceFlowDiagram

**Ubicación**: `apps/web/src/components/TraceFlowDiagram.tsx`

Componente principal que renderiza diagramas de flujo para el seguimiento de ejecución.

**Props**:
```typescript
interface TraceFlowDiagramProps {
  nodes: Node[];
  edges: Edge[];
  interactive?: boolean;
  onNodeClick?: (node: Node) => void;
  onEdgeClick?: (edge: Edge) => void;
}
```

**Implementación**:
```typescript
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';

export function TraceFlowDiagram({
  nodes: initialNodes,
  edges: initialEdges,
  interactive = true,
  onNodeClick,
  onEdgeClick
}: TraceFlowDiagramProps) {
  // Aplicar layout automático
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedGraph(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  return (
    <div className="trace-flow-container" style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={interactive ? onNodesChange : undefined}
        onEdgesChange={interactive ? onEdgesChange : undefined}
        onNodeClick={(_, node) => onNodeClick?.(node)}
        onEdgeClick={(_, edge) => onEdgeClick?.(edge)}
        nodeTypes={customNodeTypes}
        edgeTypes={customEdgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background color="#333" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'recursion':
                return '#4CAF50';
              case 'base-case':
                return '#FF5722';
              default:
                return '#2196F3';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}
```

### 2. RecursionTreeModal

**Ubicación**: `apps/web/src/components/RecursionTreeModal.tsx`

Modal especializado para mostrar árboles de recursión.

**Características**:
- Visualización de árbol de llamadas recursivas
- Información de cada nodo (entrada, salida, profundidad)
- Resaltado de caminos
- Estadísticas del árbol

**Implementación**:
```typescript
export function RecursionTreeModal({ tree, isOpen, onClose }: Props) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    
    // Resaltar camino desde raíz hasta nodo seleccionado
    const path = findPathToRoot(tree, node.id);
    setHighlightedPath(path);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="recursion-tree-modal">
        {/* Diagrama */}
        <div className="tree-diagram">
          <TraceFlowDiagram
            nodes={tree.nodes}
            edges={tree.edges}
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* Panel de información */}
        {selectedNode && (
          <div className="node-info-panel">
            <h3>Información del Nodo</h3>
            <NodeDetails node={selectedNode} />
          </div>
        )}

        {/* Estadísticas */}
        <div className="tree-stats">
          <TreeStatistics tree={tree} />
        </div>
      </div>
    </Modal>
  );
}
```

## Generación de Grafos desde Trace

### Función buildGraphFromTrace

**Ubicación**: `apps/web/src/utils/graph-builder.ts`

Convierte datos de trace en nodos y edges de React Flow.

```typescript
interface TraceData {
  steps: TraceStep[];
  recursionTree?: RecursionTreeData;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export function buildGraphFromTrace(trace: TraceData): GraphData {
  if (trace.recursionTree) {
    return buildRecursionGraph(trace.recursionTree);
  } else {
    return buildIterativeGraph(trace.steps);
  }
}
```

### Construcción de Grafo Recursivo

```typescript
function buildRecursionGraph(tree: RecursionTreeData): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Función recursiva para construir nodos
  function buildNode(
    call: RecursionCall,
    level: number,
    parentId?: string
  ): void {
    const nodeId = `node-${call.id}`;

    // Crear nodo
    nodes.push({
      id: nodeId,
      type: call.isBaseCase ? 'base-case' : 'recursion',
      data: {
        label: call.functionName,
        input: call.input,
        output: call.output,
        level: level,
        executionTime: call.executionTime
      },
      position: { x: 0, y: 0 }  // Se calculará en layout
    });

    // Crear edge desde padre
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        animated: !call.isBaseCase,
        label: `arg: ${call.input}`
      });
    }

    // Procesar llamadas hijas
    call.children?.forEach((child) => {
      buildNode(child, level + 1, nodeId);
    });
  }

  // Iniciar desde la raíz
  buildNode(tree.root, 0);

  return { nodes, edges };
}
```

### Construcción de Grafo Iterativo

```typescript
function buildIterativeGraph(steps: TraceStep[]): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  steps.forEach((step, index) => {
    const nodeId = `step-${index}`;

    // Crear nodo para cada paso
    nodes.push({
      id: nodeId,
      type: 'trace-step',
      data: {
        stepNumber: step.stepNumber,
        line: step.line,
        code: step.code,
        variables: step.variables,
        operation: step.operation
      },
      position: { x: 0, y: 0 }
    });

    // Crear edge al siguiente paso
    if (index < steps.length - 1) {
      edges.push({
        id: `edge-${index}`,
        source: nodeId,
        target: `step-${index + 1}`,
        type: 'smoothstep',
        animated: true
      });
    }
  });

  return { nodes, edges };
}
```

## Layout Automático con getLayoutedGraph

### Implementación con Dagre

**Ubicación**: `apps/web/src/utils/layout.ts`

Utiliza la biblioteca Dagre para calcular posiciones automáticas de nodos.

```typescript
import dagre from 'dagre';
import { Node, Edge } from 'reactflow';

interface LayoutOptions {
  direction: 'TB' | 'LR' | 'BT' | 'RL';
  nodeWidth: number;
  nodeHeight: number;
  rankSep: number;
  nodeSep: number;
}

const defaultOptions: LayoutOptions = {
  direction: 'TB',  // Top to Bottom
  nodeWidth: 200,
  nodeHeight: 80,
  rankSep: 100,
  nodeSep: 50
};

export function getLayoutedGraph(
  nodes: Node[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
): { nodes: Node[]; edges: Edge[] } {
  const opts = { ...defaultOptions, ...options };

  // Crear grafo de Dagre
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep
  });

  // Agregar nodos
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight
    });
  });

  // Agregar edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calcular layout
  dagre.layout(dagreGraph);

  // Aplicar posiciones calculadas
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - opts.nodeWidth / 2,
        y: nodeWithPosition.y - opts.nodeHeight / 2
      }
    };
  });

  return {
    nodes: layoutedNodes,
    edges
  };
}
```

### Layouts Especializados

#### Layout de Árbol Binario

```typescript
export function getBinaryTreeLayout(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  return getLayoutedGraph(nodes, edges, {
    direction: 'TB',
    nodeWidth: 150,
    nodeHeight: 60,
    rankSep: 80,
    nodeSep: 40
  });
}
```

#### Layout Horizontal

```typescript
export function getHorizontalLayout(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  return getLayoutedGraph(nodes, edges, {
    direction: 'LR',
    nodeWidth: 180,
    nodeHeight: 70,
    rankSep: 120,
    nodeSep: 60
  });
}
```

## Tipos de Nodos Personalizados

### RecursionNode

```typescript
import { Handle, Position, NodeProps } from 'reactflow';

export function RecursionNode({ data }: NodeProps) {
  return (
    <div className="recursion-node">
      <Handle type="target" position={Position.Top} />
      
      <div className="node-header">
        <span className="function-name">{data.label}</span>
        <span className="level-badge">L{data.level}</span>
      </div>
      
      <div className="node-body">
        <div className="node-row">
          <span className="label">Input:</span>
          <span className="value">{formatValue(data.input)}</span>
        </div>
        <div className="node-row">
          <span className="label">Output:</span>
          <span className="value">{formatValue(data.output)}</span>
        </div>
        {data.executionTime && (
          <div className="node-row">
            <span className="label">Time:</span>
            <span className="value">{data.executionTime}ms</span>
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

### BaseCaseNode

```typescript
export function BaseCaseNode({ data }: NodeProps) {
  return (
    <div className="base-case-node">
      <Handle type="target" position={Position.Top} />
      
      <div className="node-content">
        <div className="base-case-icon">🎯</div>
        <div className="function-name">{data.label}</div>
        <div className="return-value">
          return {formatValue(data.output)}
        </div>
      </div>
    </div>
  );
}
```

### TraceStepNode

```typescript
export function TraceStepNode({ data }: NodeProps) {
  return (
    <div className="trace-step-node">
      <Handle type="target" position={Position.Left} />
      
      <div className="step-header">
        <span className="step-number">#{data.stepNumber}</span>
        <span className="line-number">Line {data.line}</span>
      </div>
      
      <div className="step-code">
        <code>{data.code}</code>
      </div>
      
      <div className="step-variables">
        {Object.entries(data.variables).map(([key, value]) => (
          <div key={key} className="variable">
            <span className="var-name">{key}:</span>
            <span className="var-value">{formatValue(value)}</span>
          </div>
        ))}
      </div>
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

### Registro de Tipos Personalizados

```typescript
const customNodeTypes = {
  'recursion': RecursionNode,
  'base-case': BaseCaseNode,
  'trace-step': TraceStepNode
};
```

## Tipos de Edges Personalizados

### AnimatedEdge

```typescript
import { EdgeProps, getBezierPath } from 'reactflow';

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path animated-edge"
        d={edgePath}
        strokeWidth={2}
        stroke="#4a90e2"
      />
      {data?.label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: 12 }}
            startOffset="50%"
            textAnchor="middle"
          >
            {data.label}
          </textPath>
        </text>
      )}
    </>
  );
}
```

### Registro de Tipos de Edges

```typescript
const customEdgeTypes = {
  'animated': AnimatedEdge
};
```

## Interactividad

### Zoom, Pan y Drag

React Flow proporciona estas funcionalidades por defecto:

```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  // Habilitar drag de nodos
  nodesDraggable={true}
  // Habilitar pan del canvas
  panOnDrag={true}
  // Habilitar zoom con scroll
  zoomOnScroll={true}
  // Habilitar zoom con pinch
  zoomOnPinch={true}
  // Habilitar selección de múltiples nodos
  selectNodesOnDrag={false}
  // Configuración de zoom
  minZoom={0.1}
  maxZoom={2}
  defaultZoom={1}
>
  <Controls />
</ReactFlow>
```

### Controles Personalizados

```typescript
import { ControlButton, Controls } from 'reactflow';

<Controls>
  <ControlButton onClick={handleFitView}>
    <FitViewIcon />
  </ControlButton>
  <ControlButton onClick={handleZoomIn}>
    <ZoomInIcon />
  </ControlButton>
  <ControlButton onClick={handleZoomOut}>
    <ZoomOutIcon />
  </ControlButton>
  <ControlButton onClick={handleReset}>
    <ResetIcon />
  </ControlButton>
</Controls>
```

### Eventos de Interacción

```typescript
<ReactFlow
  // Click en nodo
  onNodeClick={(event, node) => {
    console.log('Node clicked:', node);
    setSelectedNode(node);
  }}
  
  // Double click en nodo
  onNodeDoubleClick={(event, node) => {
    console.log('Node double clicked:', node);
    expandNode(node);
  }}
  
  // Click en edge
  onEdgeClick={(event, edge) => {
    console.log('Edge clicked:', edge);
    highlightPath(edge);
  }}
  
  // Hover sobre nodo
  onNodeMouseEnter={(event, node) => {
    setHoveredNode(node);
  }}
  
  onNodeMouseLeave={(event, node) => {
    setHoveredNode(null);
  }}
  
  // Cambio en selección
  onSelectionChange={(elements) => {
    console.log('Selection changed:', elements);
  }}
/>
```

## Estilos y Temas

### Estilos CSS

```css
/* apps/web/src/styles/react-flow.css */

.trace-flow-container {
  width: 100%;
  height: 100%;
  background-color: #1a1a1a;
}

/* Nodos */
.recursion-node {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 12px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  min-width: 150px;
}

.base-case-node {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 8px;
  padding: 12px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.trace-step-node {
  background: #2a2a2a;
  border: 2px solid #4a90e2;
  border-radius: 6px;
  padding: 10px;
  color: #e0e0e0;
  min-width: 200px;
}

/* Edges */
.react-flow__edge-path {
  stroke: #4a90e2;
  stroke-width: 2;
}

.animated-edge {
  animation: dash 1s linear infinite;
  stroke-dasharray: 5;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}

/* Handles */
.react-flow__handle {
  background: #4a90e2;
  width: 10px;
  height: 10px;
  border: 2px solid white;
}

/* Controls */
.react-flow__controls {
  background: #2a2a2a;
  border: 1px solid #444;
}

.react-flow__controls-button {
  background: #3a3a3a;
  border-bottom: 1px solid #444;
  color: #e0e0e0;
}

.react-flow__controls-button:hover {
  background: #4a4a4a;
}

/* MiniMap */
.react-flow__minimap {
  background: #2a2a2a;
  border: 1px solid #444;
}
```

## Optimizaciones de Rendimiento

### Memoización de Nodos

```typescript
const MemoizedRecursionNode = memo(RecursionNode);
const MemoizedBaseCaseNode = memo(BaseCaseNode);

const customNodeTypes = {
  'recursion': MemoizedRecursionNode,
  'base-case': MemoizedBaseCaseNode
};
```

### Virtualización para Grafos Grandes

Para grafos con muchos nodos (>100):

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// Renderizar solo nodos visibles en viewport
const visibleNodes = useMemo(() => {
  return nodes.filter(node => isNodeVisible(node, viewport));
}, [nodes, viewport]);
```

### Lazy Loading de Subárboles

```typescript
const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

const visibleNodes = useMemo(() => {
  return nodes.filter(node => {
    // Mostrar nodo si está expandido o es raíz
    return node.data.level === 0 || 
           expandedNodes.has(getParentId(node));
  });
}, [nodes, expandedNodes]);
```

## Referencias

- [React Flow Documentation](https://reactflow.dev/)
- [Dagre Layout](https://github.com/dagrejs/dagre)
- [Pseudocode Tracking](./pseudocode-tracking.md)
- [Recursion Tree Modal](../api/recursive-analysis.md)
