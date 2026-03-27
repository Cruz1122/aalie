/**
 * Tipos y contratos para el módulo determinístico de Análisis de Hardware (GPU vs CPU).
 */

/**
 * Capa 1: Características Estructurales
 * Obtenidas iterando el AST.
 */
export interface HardwareFeatures {
  algorithmKind: "iterative" | "recursive" | "hybrid" | "unknown";
  topLevelLoops: number;
  nestedLoopDepth: number;
  hasWhile: boolean;
  hasRepeat: boolean;
  hasRecursion: boolean;
  recursiveFanOut: number;
  hasDivideAndConquerShape: boolean;
  hasEarlyReturn: boolean; // Ejemplo: return en medio del cuerpo
  hasBreakLikeExit: boolean; // Break literal, assign de control flags obvios
  branchDensityInsideLoops: number; // (ifs en ciclos) / totalLoops
  dataDependentConditions: number; // While u conds que dependen de vars externas locales mutadas
  scalarReductions: number; // x = x + ...
  mapLikeWrites: number; // A[i] = ...
  stencilLikeAccesses: number; // A[i] = A[i-1] + A[i+1]
  indirectIndexedAccesses: number; // A[B[i]]
  pointerOrObjectAccesses: number; // p.next, tree.left
  graphLikeTraversalSignals: number; // BFS, DFS like queues/stacks
  loopCarriedDependencies: number; // x = f(x) inter iteraciones o A[i] = f(A[i-1])
  sequentialStateUpdates: number; // Acumuladores cruzados complejos
  estimatedParallelWorkUnits: "low" | "medium" | "high" | "unknown";
  memoryRegularity: "regular" | "mixed" | "irregular" | "unknown";
  controlRegularity: "regular" | "mixed" | "irregular" | "unknown";
  dependencyStrength: "none" | "weak" | "medium" | "strong" | "unknown";
}

/**
 * Capa 2: Resumen de Dependencias
 */
export interface LoopDependencySummary {
  loopId: string;
  variablesRead: string[];
  variablesWritten: string[];
  accumulators: string[];
  isMapLike: boolean;
  hasLoopCarriedDependency: boolean;
  hasDataDependentControl: boolean;
  classification:
    | "embarrassingly_parallel"
    | "parallel_with_reduction"
    | "weakly_parallel"
    | "sequential_by_dependency"
    | "unknown";
}

export interface RecursionDependencySummary {
  functionName: string;
  independentBranches: boolean;
  sequentialMerge: boolean;
}

export interface DependencyProfile {
  loops: LoopDependencySummary[];
  recursion: RecursionDependencySummary[];
  globalRisk: "low" | "medium" | "high" | "unknown";
}

/**
 * Capa 3: Patrones encontrados
 */
export interface PatternCandidate {
  name: string; // ej. "map element-wise", "reduction", "stencil", "early exit", "divide and conquer"
  confidence: number; // 0.0 - 1.0
  evidence: string[];
}

/**
 * Capa 4: Resultado del scoring base
 */
export interface HardwareScore {
  gpu: number; // 0-100 (referencial)
  cpu: number; // 0-100
  hybrid: number; // 0-100
  confidence: number; // 0.0 - 1.0
}

/**
 * Evidencia atómica para auditoría interna
 */
export interface EvidenceItem {
  kind: "feature" | "dependency" | "pattern" | "veto" | "invariant" | "trace";
  message: string;
  location?: {
    line?: number;
    nodeId?: string;
  };
}

/**
 * Capa 5 y Externa: Reporte Final (Contrato Público)
 */
export interface HardwareSuitabilityReport {
  primaryRecommendation: "cpu" | "gpu" | "hybrid";
  internalVerdict: "cpu" | "gpu" | "hybrid" | "inconclusive";
  confidence: "high" | "medium" | "low";
  scores: {
    cpu: number;
    gpu: number;
    hybrid: number;
  };
  summary: string;
  reasons: {
    positive: string[];
    negative: string[];
    blockers: string[];
    opportunities: string[];
  };
  detectedPatterns: {
    name: string;
    confidence: number;
    evidence: string[];
  }[];
  evidence: EvidenceItem[];
  diagnostics: {
    controlRegularity: "regular" | "mixed" | "irregular" | "unknown";
    memoryRegularity: "regular" | "mixed" | "irregular" | "unknown";
    dependencyStrength: "none" | "weak" | "medium" | "strong" | "unknown";
    parallelismType: "data" | "task" | "mixed" | "limited" | "unknown";
  };
}
