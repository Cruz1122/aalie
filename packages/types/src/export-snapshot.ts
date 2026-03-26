import type {
  AnalyzeOpenResponse,
  LoopInvariant,
  Program,
  RecursiveMethodStepBundle,
} from "./index";

export const SNAPSHOT_SCHEMA_VERSION = "1.0.0" as const;

export type SnapshotAlgorithmType =
  | "iterative"
  | "recursive"
  | "hybrid"
  | "dummy"
  | "unknown";

export type SnapshotSourceOrigin = "editor" | "example" | "chatbot" | "txt" | "api";
export type SnapshotCase = "worst" | "best" | "avg";

export type SnapshotRecursiveMethod =
  | "iteration"
  | "master"
  | "recursion_tree"
  | "characteristic_equation";

export type SnapshotRecurrenceType =
  | "divide_conquer"
  | "divide_conquer_multi"
  | "linear_shift";

export type SnapshotSectionStatus =
  | "available"
  | "not_requested"
  | "not_supported"
  | "not_implemented"
  | "missing_data";

export interface SnapshotWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "critical";
  source?: "parse" | "analysis" | "trace" | "llm" | "gpu_cpu" | "system";
}

export interface SnapshotSection<T> {
  status: SnapshotSectionStatus;
  data?: T;
  warnings?: SnapshotWarning[];
  todos?: string[];
}

export type SnapshotRecurrence =
  | {
      type: "divide_conquer";
      form: string;
      a: number;
      b: number;
      f: string;
      n0: number;
      method?: SnapshotRecursiveMethod;
      notes?: string[];
    }
  | {
      type: "divide_conquer_multi";
      form: string;
      terms: Array<{ a: number; b: number }>;
      a: number;
      f: string;
      n0: number;
      method?: SnapshotRecursiveMethod;
      notes?: string[];
    }
  | {
      type: "linear_shift";
      form: string;
      order: number;
      shifts: number[];
      coefficients: number[];
      "g(n)"?: string;
      n0: number;
      method?: SnapshotRecursiveMethod;
      notes?: string[];
    };

export type SnapshotRecursiveMethodDetail =
  | {
      method: "iteration";
      detail: NonNullable<AnalyzeOpenResponse["totals"]["iteration"]>;
    }
  | {
      method: "master";
      detail: NonNullable<AnalyzeOpenResponse["totals"]["master"]>;
    }
  | {
      method: "recursion_tree";
      detail: NonNullable<AnalyzeOpenResponse["totals"]["recursion_tree"]>;
    }
  | {
      method: "characteristic_equation";
      detail: NonNullable<AnalyzeOpenResponse["totals"]["characteristic_equation"]>;
    };

export interface SnapshotAlgorithmInfo {
  name: string;
  parameters: string[];
}

export interface SnapshotMeta {
  analysisId: string;
  sourceOrigin: SnapshotSourceOrigin;
  algorithm: SnapshotAlgorithmInfo;
  algorithmTypeDetected: SnapshotAlgorithmType;
  methodsApplied: SnapshotRecursiveMethod[];
  methodsAvailable: SnapshotRecursiveMethod[];
  hasCaseVariability: boolean;
  validity: {
    parseOk: boolean;
    analysisOk: boolean;
    traceOk: boolean;
  };
  warnings: SnapshotWarning[];
  limitations: string[];
}

export interface SnapshotParseObservation {
  ok: boolean;
  available?: boolean;
  runtime?: string;
  error?: string;
  errors?: Array<{ line: number; column: number; message: string }>;
}

export interface SnapshotTraceSummaryItem {
  case: SnapshotCase;
  kind?: "iterative" | "recursive" | "hybrid" | "unknown";
  totalSteps?: number;
  totalCalls?: number;
  maxRecursionDepth?: number;
  truncated?: boolean;
  warnings?: string[];
}

export interface SnapshotInput {
  originalPseudocode: string;
  normalizedPseudocode: SnapshotSection<string>;
  procedureName?: string;
  parameters: string[];
  parsingObservations: SnapshotParseObservation;
  analysisSummary: {
    hasCaseVariability: boolean;
    availableCases: SnapshotCase[];
  };
  traceSummary: SnapshotSection<SnapshotTraceSummaryItem[]>;
}

export interface SnapshotInternal {
  ast: SnapshotSection<Program>;
  classification: SnapshotSection<{
    kind: SnapshotAlgorithmType;
    method?: string;
  }>;
  recurrence: SnapshotSection<SnapshotRecurrence>;
  intermediateMath: SnapshotSection<{
    proof?: NonNullable<AnalyzeOpenResponse["totals"]["proof"]>;
    characteristicEquation?: AnalyzeOpenResponse["totals"]["characteristic_equation"];
    characteristicEquationStepByStep?: NonNullable<
      AnalyzeOpenResponse["totals"]["characteristic_equation"]
    >["step_by_step"];
    iteration?: AnalyzeOpenResponse["totals"]["iteration"];
    iterationStepByStep?: NonNullable<
      AnalyzeOpenResponse["totals"]["iteration"]
    >["step_by_step"];
    master?: AnalyzeOpenResponse["totals"]["master"];
    masterStepByStep?: NonNullable<
      AnalyzeOpenResponse["totals"]["master"]
    >["step_by_step"];
    recursionTree?: AnalyzeOpenResponse["totals"]["recursion_tree"];
    recursionTreeStepByStep?: NonNullable<
      AnalyzeOpenResponse["totals"]["recursion_tree"]
    >["step_by_step"];
  }>;
}

export interface SnapshotCaseResult {
  case: SnapshotCase;
  T_open?: string;
  T_polynomial?: string;
  big_o?: string;
  big_omega?: string;
  big_theta?: string;
  explanationSteps?: string[];
  raw?: AnalyzeOpenResponse;
}

export interface SnapshotGlobalResult {
  cases: Record<SnapshotCase, SnapshotCaseResult | null>;
}

export interface IterativeSnapshotSection {
  lineCostTable: Record<SnapshotCase, AnalyzeOpenResponse["byLine"] | null>;
  summations: Record<SnapshotCase, string | null>;
  simplificationSteps: Record<SnapshotCase, string[] | null>;
  asymptoticProcedure: Record<SnapshotCase, string[] | null>;
  trace: SnapshotSection<
    Record<SnapshotCase, {
      steps: unknown[];
      summary?: {
        totalSteps?: number;
        totalCalls?: number;
        maxRecursionDepth?: number;
        algorithmKind?: string;
      };
      diagnostics?: {
        truncated?: boolean;
        truncationReason?: string;
        warnings?: string[];
      };
      callTreeSource?: unknown;
    } | null>
  >;
  loopInvariant: SnapshotSection<LoopInvariant>;
}

export interface RecursiveSnapshotSection {
  recurrence: SnapshotSection<SnapshotRecurrence>;
  selectedMethod: SnapshotSection<SnapshotRecursiveMethod>;
  methodsAvailable: SnapshotSection<SnapshotRecursiveMethod[]>;
  methodDetails: SnapshotSection<SnapshotRecursiveMethodDetail[]>;
  presentation?: {
    summary?: string;
    conceptNote?: string;
    warning?: string;
    supportReason?: string;
    renderHints?: {
      stepExplanationStyle?: "italic";
      latexExplanationSize?: "footnotesize";
      markdownExplanationStyle?: "italic";
    };
  };
  rootsAndMultiplicities: SnapshotSection<
    Array<{ root: string; multiplicity: number }>
  >;
  stepByStep: SnapshotSection<RecursiveMethodStepBundle>;
  closedForm: SnapshotSection<{
    homogeneousSolution?: string;
    particularSolution?: string;
    generalSolution?: string;
    closedForm?: string;
    theta?: string;
    baseCases?: Record<string, number>;
  }>;
  recursionTreeSerializable: SnapshotSection<AnalyzeOpenResponse["totals"]["recursion_tree"]>;
  callTrace: SnapshotSection<
    Record<SnapshotCase, {
      steps: unknown[];
      callTreeSource?: unknown;
      summary?: {
        totalSteps?: number;
        totalCalls?: number;
        maxRecursionDepth?: number;
        algorithmKind?: string;
      };
      diagnostics?: {
        truncated?: boolean;
        truncationReason?: string;
        warnings?: string[];
      };
    } | null>
  >;
}

export interface SnapshotLlmComparative {
  raw?: unknown;
  normalized?: {
    verdict?: string;
    confidence?: number;
    matches?: string[];
    differences?: string[];
    note?: string;
  };
}

export interface SnapshotGpuCpuComparative {
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
  evidence: {
    kind: string;
    message: string;
    location?: {
      line?: number;
      nodeId?: string;
    };
  }[];
  diagnostics: {
    controlRegularity: "regular" | "mixed" | "irregular" | "unknown";
    memoryRegularity: "regular" | "mixed" | "irregular" | "unknown";
    dependencyStrength: "none" | "weak" | "medium" | "strong" | "unknown";
    parallelismType: "data" | "task" | "mixed" | "limited" | "unknown";
  };
}

export interface SnapshotComparative {
  llm: SnapshotSection<SnapshotLlmComparative>;
  gpuCpu: SnapshotSection<SnapshotGpuCpuComparative>;
}

export interface SnapshotInstitutional {
  disclaimer: string;
  caseLimitations: string[];
  generalLimitations: string[];
}

export type SnapshotByAlgorithm =
  | {
      algorithmType: "iterative";
      iterative: SnapshotSection<IterativeSnapshotSection>;
      recursive: SnapshotSection<never>;
    }
  | {
      algorithmType: "recursive";
      iterative: SnapshotSection<IterativeSnapshotSection>;
      recursive: SnapshotSection<RecursiveSnapshotSection>;
    }
  | {
      algorithmType: "hybrid";
      iterative: SnapshotSection<IterativeSnapshotSection>;
      recursive: SnapshotSection<RecursiveSnapshotSection>;
    }
  | {
      algorithmType: "dummy" | "unknown";
      iterative: SnapshotSection<IterativeSnapshotSection>;
      recursive: SnapshotSection<RecursiveSnapshotSection>;
    };

export interface AalieAnalysisSnapshotV1Base {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  snapshotId: string;
  contentHash: string;
  createdAt: string;
  locale: "es" | "en";
  meta: SnapshotMeta;
  input: SnapshotInput;
  internal: SnapshotInternal;
  globalResult: SnapshotGlobalResult;
  comparative: SnapshotComparative;
  institutional: SnapshotInstitutional;
}

export type AalieAnalysisSnapshotV1 = AalieAnalysisSnapshotV1Base & SnapshotByAlgorithm;
