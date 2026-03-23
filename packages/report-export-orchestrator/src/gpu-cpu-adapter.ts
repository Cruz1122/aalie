import type { Program, SnapshotGpuCpuComparative } from "@aa/types";

import { analyzeASTForGPUCPU } from "./gpu-cpu/gpu-cpu-analyzer";

export function buildGpuCpuComparative(
  ast: Program | null | undefined,
  locale: "es" | "en",
): SnapshotGpuCpuComparative | null {
  if (!ast) return null;

  const r = analyzeASTForGPUCPU(ast, locale);

  // Map HardwareSuitabilityReport → SnapshotGpuCpuComparative
  return {
    primaryRecommendation: r.primaryRecommendation,
    internalVerdict: r.internalVerdict,
    confidence: r.confidence,
    scores: r.scores,
    summary: r.summary,
    reasons: r.reasons,
    detectedPatterns: r.detectedPatterns,
    evidence: r.evidence,
    diagnostics: r.diagnostics,
  };
}

