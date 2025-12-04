export type CaseType = "worst" | "best" | "avg";

// Escenarios de seguimiento para algoritmos iterativos
export type TraceScenario = "best" | "avg" | "worst";

// Tipo de algoritmo para el seguimiento
export type TraceKind = "iterative" | "recursive" | "hybrid";

// Input interno que se construye para alimentar al backend de trazas
export interface InternalInput {
  n: number;
  array?: number[];
  x?: number;
  // Espacio para otros parámetros específicos en el futuro
  // (por ejemplo, matrices, valores escalares adicionales, etc.)
  [key: string]: unknown;
}

// Configuración de seguimiento por tipo de algoritmo
export interface TraceConfig {
  kind: TraceKind;
  controls: {
    // Mostrar selector de escenario (best/avg/worst)
    scenario: boolean;
    // Mostrar control de tamaño n
    n: boolean;
    // Permitir editar el array desde el UI (en esta versión siempre false)
    arrayEditable: boolean;
  };
  inputGenerator?: {
    best?: (n: number) => InternalInput;
    avg?: (n: number) => InternalInput;
    worst?: (n: number) => InternalInput;
  };
}

export interface ExecutionIterationInfo {
  loopVar?: string;
  currentValue?: number;
  maxValue?: number;
  iteration?: number;
}

export interface ExecutionRecursionInfo {
  depth: number;
  callId: string;
  params: Record<string, unknown>;
  procedure?: string;
}

export interface ExecutionStep {
  step_number: number;
  line: number;
  kind: string;
  variables: Record<string, string | number>;
  iteration?: ExecutionIterationInfo;
  recursion?: ExecutionRecursionInfo;
  cost?: string;
  accumulated_cost?: string;
  description?: string;
}

export interface RecursionTreeCall {
  id: string;
  depth: number;
  params: Record<string, unknown>;
  children: string[];
  parent_id?: string | null;
  is_base_case?: boolean;
  return_value?: unknown;
}

export interface ExecutionTrace {
  steps: ExecutionStep[];
  recursionTree?: {
    calls: RecursionTreeCall[];
    root_calls: string[];
  };
}

export interface TraceApiResponse {
  ok: boolean;
  trace?: ExecutionTrace;
  algorithmKind?: string;
  errors?: Array<{ message: string; line?: number; column?: number }>;
}

export interface GraphNodeData {
  label: string;
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: GraphNodeData;
  parentId?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
}

export interface TraceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DiagramGraphResponse {
  ok: boolean;
  graph?: TraceGraph;
  explanation?: string;
  error?: string;
}
