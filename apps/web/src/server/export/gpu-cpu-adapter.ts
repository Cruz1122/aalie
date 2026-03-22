import type { Program, SnapshotGpuCpuComparative } from "@aa/types";

import { analyzeASTForGPUCPU } from "@/lib/gpu-cpu-analyzer";

export function buildGpuCpuComparative(
  ast: Program | null | undefined,
  locale: "es" | "en",
): SnapshotGpuCpuComparative | null {
  if (!ast) return null;

  const result = analyzeASTForGPUCPU(ast, locale);
  return {
    profile: result.profile,
    summary: result.summary,
    explanation: result.explanation,
    recommendation: result.recommendation,
    gpuScore: result.gpuScore,
    cpuScore: result.cpuScore,
    metrics: {
      totalLoops: result.metrics.totalLoops,
      maxLoopDepth: result.metrics.maxLoopDepth,
      conditionalsInLoops: result.metrics.conditionalsInLoops,
      isRecursive: result.metrics.isRecursive,
      recursiveCallCount: result.metrics.recursiveCallCount,
      arrayAccessCount: result.metrics.arrayAccessCount,
      callsInsideLoops: result.metrics.callsInsideLoops,
    },
  };
}
