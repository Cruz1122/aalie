/**
 * Tipos y contratos para el módulo determinístico de Análisis de Hardware (GPU vs CPU).
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
  hasEarlyReturn: boolean;
  hasBreakLikeExit: boolean;
  branchDensityInsideLoops: number;
  dataDependentConditions: number;
  scalarReductions: number;
  mapLikeWrites: number;
  stencilLikeAccesses: number;
  indirectIndexedAccesses: number;
  pointerOrObjectAccesses: number;
  graphLikeTraversalSignals: number;
  loopCarriedDependencies: number;
  sequentialStateUpdates: number;
  estimatedParallelWorkUnits: "low" | "medium" | "high" | "unknown";
  memoryRegularity: "regular" | "mixed" | "irregular" | "unknown";
  controlRegularity: "regular" | "mixed" | "irregular" | "unknown";
  dependencyStrength: "none" | "weak" | "medium" | "strong" | "unknown";
}

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

export interface PatternCandidate {
  name: string;
  confidence: number;
  evidence: string[];
}

export interface HardwareScore {
  gpu: number;
  cpu: number;
  hybrid: number;
  confidence: number;
}

export interface EvidenceItem {
  kind: "feature" | "dependency" | "pattern" | "veto" | "invariant" | "trace";
  message: string;
  location?: {
    line?: number;
    nodeId?: string;
  };
}

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

