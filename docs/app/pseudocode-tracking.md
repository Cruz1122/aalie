# Seguimiento de Pseudocódigo y Generación de Diagramas

## Descripción General

El sistema de seguimiento de pseudocódigo permite visualizar la ejecución paso a paso de algoritmos, tanto iterativos como recursivos. Para algoritmos iterativos, se utiliza el endpoint `/trace` que instrumenta el código. Para algoritmos recursivos, se genera un diagrama visual usando LLM (Gemini).

## Componentes Principales

### 1. ExecutionTraceModal

**Ubicación**: `apps/web/src/components/ExecutionTraceModal.tsx`

Componente modal principal que orquesta la visualización del trace.

**Responsabilidades**:
- Determinar si el algoritmo es iterativo o recursivo
- Renderizar el componente de trace apropiado
- Manejar la carga y actualización de datos
- Gestionar el estado del modal

**Props**:
```typescript
interface ExecutionTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  inputs: Record<string, any>;
  algorithmType?: 'iterative' | 'recursive';
  analysisResult?: AnalysisResult;  // Incluye clasificación del algoritmo
}
```

**Lógica de Detección de Tipo**:
```typescript
const isRecursive = useMemo(() => {
  // 1. Prioridad: algorithmType del clasificador
  if (analysisResult?.classification?.algorithmType) {
    return analysisResult.classification.algorithmType === 'recursive';
  }
  
  // 2. Fallback: presencia de recursionTree en trace
  if (trace?.trace?.recursionTree) {
    return true;
  }
  
  // 3. Fallback: información de recursión en steps
  if (trace?.trace?.steps?.some(step => step.recursion)) {
    return true;
  }
  
  return false;
}, [analysisResult, trace]);
```

### 2. IterativeTraceContent

**Ubicación**: `apps/web/src/components/IterativeTraceContent.tsx`

Componente para visualizar el trace de algoritmos iterativos.

**Características**:
- Navegación paso a paso (anterior/siguiente)
- Visualización de variables en cada paso
- Resaltado de código actual
- Animaciones de transición
- Scroll automático al código actual

**Estructura**:
```typescript
interface IterativeTraceContentProps {
  steps: TraceStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
}

interface TraceStep {
  stepNumber: number;
  line: number;
  code: string;
  variables: Record<string, any>;
  operation: 'initialization' | 'condition' | 'assignment' | 'operation';
  conditionResult?: boolean;
  description: string;
}
```

**Visualización de Variables**:
```tsx
<div className="variables-container">
  {Object.entries(step.variables).map(([key, value]) => (
    <div key={key} className="variable-item">
      <span className="variable-key">{key}:</span>
      <span className="variable-value">
        {formatValue(value)}
      </span>
    </div>
  ))}
</div>
```

**Formateo de Valores**:
- Arrays pequeños: `[1, 2, 3, 4, 5]`
- Arrays grandes: Scroll horizontal
- Objetos: JSON formateado
- Strings largos: Truncado con tooltip

### 3. RecursiveTraceContent

**Ubicación**: `apps/web/src/components/RecursiveTraceContent.tsx`

Componente para visualizar el trace de algoritmos recursivos.

**Características**:
- Árbol de recursión interactivo (React Flow)
- Diagrama Mermaid generado por LLM
- Explicación textual del proceso
- Visualización del call stack
- Botón de recarga para regenerar diagrama

**Estructura**:
```typescript
interface RecursiveTraceContentProps {
  recursionTree?: RecursionTree;
  diagram?: DiagramData;
  steps?: RecursiveStep[];
  onReload?: () => void;
}

interface RecursionTree {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface DiagramData {
  type: 'mermaid';
  content: string;
  explanation: string;
}
```

**Secciones del Componente**:

1. **Árbol de Recursión** (React Flow)
```tsx
<TraceFlowDiagram
  nodes={recursionTree.nodes}
  edges={recursionTree.edges}
  interactive={true}
/>
```

2. **Diagrama Mermaid**
```tsx
<div className="diagram-section">
  <MermaidDiagram content={diagram.content} />
  <button onClick={onReload}>
    Regenerar Diagrama
  </button>
</div>
```

3. **Explicación**
```tsx
<div className="explanation-section">
  <ReactMarkdown>
    {diagram.explanation}
  </ReactMarkdown>
</div>
```

## Flujo de Datos

### Para Algoritmos Iterativos

```
Usuario → ExecutionTraceModal → API /trace → Backend ejecuta código
                                              ↓
                                        Instrumentación
                                              ↓
                                        Captura pasos
                                              ↓
Frontend ← TraceResponse ← Backend retorna steps
    ↓
IterativeTraceContent
    ↓
Visualización paso a paso
```

### Para Algoritmos Recursivos

```
Usuario → ExecutionTraceModal → API /trace → Backend detecta recursión
                                              ↓
                                        Llama a Gemini LLM
                                              ↓
                                        Genera diagrama Mermaid
                                              ↓
                                        Construye árbol de recursión
                                              ↓
Frontend ← TraceResponse ← Backend retorna tree + diagram
    ↓
RecursiveTraceContent
    ↓
Visualización de árbol + diagrama
```

## Endpoint `/trace`

### Request

```typescript
const response = await fetch('/api/analyze/trace', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code,
    language,
    inputs,
    algorithmType
  })
});
```

### Response Iterativo

```typescript
{
  "success": true,
  "trace": {
    "type": "iterative",
    "steps": [...],
    "totalSteps": 45,
    "finalState": {...}
  },
  "metadata": {
    "executionTime": 125,
    "tokensUsed": 0,
    "estimatedCost": 0
  }
}
```

### Response Recursivo

```typescript
{
  "success": true,
  "trace": {
    "type": "recursive",
    "recursionTree": {
      "nodes": [...],
      "edges": [...]
    },
    "diagram": {
      "type": "mermaid",
      "content": "graph TD...",
      "explanation": "..."
    },
    "steps": [...]
  },
  "metadata": {
    "executionTime": 2340,
    "tokensUsed": 1250,
    "estimatedCost": 0.00125,
    "model": "gemini-1.5-flash"
  }
}
```

## Generación de Diagramas con LLM

### Proceso para Algoritmos Recursivos

1. **Preparación del Prompt**
```typescript
const prompt = `
Analiza el siguiente código recursivo y genera un diagrama de árbol de recursión en formato Mermaid.

Código:
\`\`\`${language}
${code}
\`\`\`

Inputs: ${JSON.stringify(inputs)}

Genera:
1. Un diagrama Mermaid mostrando el árbol de llamadas recursivas
2. Una explicación detallada del proceso de recursión
3. Los valores de entrada y salida de cada llamada

Formato de respuesta:
\`\`\`mermaid
[diagrama aquí]
\`\`\`

Explicación:
[explicación aquí]
`;
```

2. **Llamada al LLM**
```typescript
const response = await gemini.generateContent({
  model: 'gemini-1.5-flash',
  prompt,
  maxOutputTokens: 2048
});
```

3. **Parseo de Respuesta**
```typescript
const { diagram, explanation } = parseLLMResponse(response.text);
```

4. **Construcción del Árbol**
```typescript
const { nodes, edges } = buildRecursionTree(diagram);
```

### Formato del Diagrama Mermaid

```mermaid
graph TD
  A[fib(5) = 5] --> B[fib(4) = 3]
  A --> C[fib(3) = 2]
  B --> D[fib(3) = 2]
  B --> E[fib(2) = 1]
  C --> F[fib(2) = 1]
  C --> G[fib(1) = 1]
  D --> H[fib(2) = 1]
  D --> I[fib(1) = 1]
  E --> J[fib(1) = 1]
  E --> K[fib(0) = 0]
  F --> L[fib(1) = 1]
  F --> M[fib(0) = 0]
  H --> N[fib(1) = 1]
  H --> O[fib(0) = 0]
  
  style A fill:#4CAF50
  style B fill:#2196F3
  style C fill:#2196F3
```

## Integración con React Flow

### TraceFlowDiagram

**Ubicación**: `apps/web/src/components/TraceFlowDiagram.tsx`

Componente que renderiza el árbol de recursión usando React Flow.

**Características**:
- Layout automático (dagre)
- Nodos personalizados con información de llamada
- Edges con etiquetas
- Zoom y pan
- Resaltado de nodos al hover

**Implementación**:
```typescript
import ReactFlow, { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

export function TraceFlowDiagram({ nodes, edges }: Props) {
  const { nodes: layoutedNodes, edges: layoutedEdges } = 
    getLayoutedGraph(nodes, edges);

  return (
    <div className="trace-flow-container">
      <ReactFlow
        nodes={layoutedNodes}
        edges={layoutedEdges}
        nodeTypes={customNodeTypes}
        edgeTypes={customEdgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

### Nodos Personalizados

```typescript
const RecursionNode = ({ data }: NodeProps) => (
  <div className="recursion-node">
    <div className="node-label">{data.label}</div>
    <div className="node-details">
      <span>Input: {data.input}</span>
      <span>Output: {data.output}</span>
      <span>Level: {data.level}</span>
    </div>
  </div>
);

const customNodeTypes = {
  recursion: RecursionNode
};
```

## Manejo de Estados

### Estados de Carga

```typescript
const [traceState, setTraceState] = useState<{
  loading: boolean;
  error: string | null;
  data: TraceData | null;
}>({
  loading: false,
  error: null,
  data: null
});
```

### Regeneración de Diagrama

Para algoritmos recursivos, el usuario puede regenerar el diagrama:

```typescript
const handleReload = async () => {
  setTraceState({ ...traceState, loading: true });
  
  try {
    const response = await fetch('/api/analyze/trace', {
      method: 'POST',
      body: JSON.stringify({ code, language, inputs, algorithmType: 'recursive' })
    });
    
    const data = await response.json();
    setTraceState({ loading: false, error: null, data });
  } catch (error) {
    setTraceState({ 
      loading: false, 
      error: 'Error al regenerar diagrama', 
      data: traceState.data 
    });
  }
};
```

## Estilos y Animaciones

### Transiciones de Pasos

```css
.trace-step {
  transition: all 0.3s ease-in-out;
  opacity: 0;
  transform: translateX(-20px);
}

.trace-step.active {
  opacity: 1;
  transform: translateX(0);
}
```

### Resaltado de Código

```css
.code-line {
  padding: 4px 8px;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.code-line.current {
  background-color: rgba(74, 144, 226, 0.1);
  border-left-color: #4a90e2;
}
```

### Variables Animadas

```css
.variable-value {
  transition: background-color 0.3s;
}

.variable-value.changed {
  background-color: rgba(76, 175, 80, 0.2);
  animation: highlight 0.6s ease-out;
}

@keyframes highlight {
  0% { background-color: rgba(76, 175, 80, 0.4); }
  100% { background-color: transparent; }
}
```

## Optimizaciones de Rendimiento

### Virtualización para Muchos Pasos

Para algoritmos con muchos pasos (>100), se usa virtualización:

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={steps.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TraceStep step={steps[index]} />
    </div>
  )}
</FixedSizeList>
```

### Memoización

```typescript
const formattedVariables = useMemo(
  () => formatVariables(step.variables),
  [step.variables]
);

const MemoizedTraceStep = memo(TraceStep);
```

## Referencias

- [React Flow Documentation](./react-flow.md)
- [Trace Endpoint API](../api/trace-endpoint.md)
- [LLM Usage](../llm/usage-and-models.md)
