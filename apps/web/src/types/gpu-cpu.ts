/**
 * Tipos para el análisis GPU vs CPU
 */

export type GPUCPUProfile = "GPU" | "CPU" | "Mixto";

/**
 * Métricas extraídas del AST
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
export interface GPUCPUAnalysisResult {
  profile: GPUCPUProfile;
  summary: string;
  explanation: string;
  recommendation: string;
  metrics: GPUCPUMetrics;
  gpuScore: number; // 0-100
  cpuScore: number; // 0-100
}

