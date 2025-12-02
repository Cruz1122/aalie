export type CaseType = "worst" | "best" | "avg";

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


