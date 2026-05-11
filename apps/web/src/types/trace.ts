import type { DiagramKind } from "@aa/types";

export type { DiagramKind };
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

// Configuración unificada del seguimiento
export interface TraceConfig {
  kind: TraceKind;
  case?: "best" | "avg" | "worst";
  inputSize?: number;
  initialVariablesOverride?: Record<string, unknown>;
  inputGenerationMode?: "auto" | "manual" | "mixed";
  controls: {
    scenario: boolean;
    n: boolean;
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

/** Tipos de evento de paso (eventKind). Alineado con backend. */
export type ExecutionEventKind =
  | "assign"
  | "condition_eval"
  | "loop_enter"
  | "loop_iter_enter"
  | "loop_iter_exit"
  | "loop_exit"
  | "call_enter"
  | "call_spawn_child"
  | "call_resume"
  | "return_emit"
  | "call_exit"
  | "operation_enter"
  | "operation_exit"
  | "state_mutation"
  | "result_emit"
  | "print"
  | "end"
  | "enter_block";

export interface ExecutionStep {
  id?: string;
  step_number: number;
  line: number | null;
  kind: string;
  /** Alias semántico de kind para clasificación estructural. */
  eventKind?: string;
  variables: Record<string, string | number>;
  iteration?: ExecutionIterationInfo;
  recursion?: ExecutionRecursionInfo;
  cost?: string;
  accumulated_cost?: string;
  description?: string;
  microseconds?: number;
  tokens?: number;
}

/** Nodo del árbol de llamadas recursivas (call tree). No confundir con árbol de recurrencia (recurrence tree). */
export interface RecursionCallNode {
  id: string;
  depth: number;
  params: Record<string, unknown>;
  children: string[];
  parent_id?: string | null;
  is_base_case?: boolean;
  return_value?: unknown;
}

/** Fuente del árbol de llamadas recursivas. Backend envía como recursionTree. */
export interface RecursionCallTree {
  calls: RecursionCallNode[];
  root_calls: string[];
}

/** Diagnósticos de la traza (truncamiento, advertencias). */
export interface TraceDiagnostics {
  truncated: boolean;
  truncationReason?:
    | "max_depth"
    | "max_steps"
    | "max_nodes"
    | "timeout"
    | "unsupported_pattern";
  warnings: string[];
}

/** Resumen de la traza. */
export interface TraceSummary {
  totalSteps: number;
  totalCalls: number;
  maxRecursionDepth: number;
  algorithmKind: "iterative" | "recursive" | "hybrid" | "unknown";
}

export interface ExecutionTrace {
  kind?: "iterative" | "recursive" | "hybrid" | "unknown";
  steps: ExecutionStep[];
  /** Fuente para construir el árbol de llamadas recursivas. El backend envía como recursionTree. */
  callTreeSource?: RecursionCallTree;
  /** @deprecated Usar callTreeSource. Campo legacy del API. */
  recursionTree?: RecursionCallTree;
  summary?: TraceSummary;
  diagnostics?: TraceDiagnostics;
}

/** Patrones estructurales detectados por el clasificador. */
export type StructuralPatternKind =
  | "generic_iterative"
  | "iterative_with_auxiliary_operation"
  | "generic_recursive"
  | "tail_recursive_linear"
  | "single_branch_recursive_search"
  | "binary_branch_recursive"
  | "multi_branch_recursive_fanout"
  | "divide_partition_recurse"
  | "divide_merge_recurse"
  | "divide_compute_recurse"
  | "backtracking_stateful"
  | "mutual_recursion"
  | "hybrid_recursive_iterative"
  | "unknown";

/** Clasificación estructural de la traza. */
export interface StructuralTraceClassification {
  patternKind: StructuralPatternKind;
  confidence: "high" | "medium" | "low";
  evidence: string[];
}

/** Traza estructurada: fuente única del diagrama. */
export interface StructuredTrace {
  patternKind: StructuralPatternKind;
  graph: TraceGraph;
  classification: StructuralTraceClassification;
}

/** Artefactos derivados de la traza. */
export interface TraceDerived {
  structuredTrace?: StructuredTrace;
  explanation?: {
    summary?: string;
    blocks?: Array<{ stepId?: string; text: string; kind?: string }>;
  };
}

export interface TraceApiResponse {
  ok: boolean;
  trace?: ExecutionTrace;
  algorithmKind?: string;
  errors?: Array<{ message: string; line?: number; column?: number }>;
  /** Artefactos derivados. */
  derived?: TraceDerived;
}

export interface GraphNodeData {
  label: string;
  microseconds?: number;
  tokens?: number;
  iterationPath?: string;
  loopVar?: string;
  loopValue?: number;
  depth?: number;
  phase?: string;
  nodeType?: string;
  callId?: string;
  parentCallId?: string | null;
  branchCount?: number;
  isBaseCase?: boolean;
  returnValue?: unknown;
  executionOrder?: number;
  returnOrder?: number;
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
