import type { HardwareSuitabilityReport } from "@/lib/hardware/types";

export type GPUCPUProfile = "GPU" | "CPU" | "Mixto";

/**
 * Métricas extraídas del AST (Legacy, puede usarse transitoriamente)
 */
export interface GPUCPUMetrics {
  totalLoops: number;
  maxLoopDepth: number;
  conditionalsInLoops: number;
  isRecursive: boolean;
  recursiveCallCount: number;
  arrayAccessCount: number;
  callsInsideLoops: number;
}

/**
 * Resultado completo del análisis GPU vs CPU
 */
export type GPUCPUAnalysisResult = HardwareSuitabilityReport;
