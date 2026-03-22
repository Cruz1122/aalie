/**
 * gpu-cpu-analyzer.ts
 * Shim: delegates to the new deterministic hardware analyzer (hardware/index.ts).
 */
import type { Program } from "@aa/types";
import type { GpuCpuLocale } from "./gpu-cpu-texts";
import { analyzeASTForHardware } from "./hardware/index";
import type { HardwareSuitabilityReport } from "./hardware/types";

export type { HardwareSuitabilityReport };

/**
 * Legacy-compatible entry point — now delegates to the deterministic 5-layer engine.
 */
export function analyzeASTForGPUCPU(
  ast: Program,
  locale: GpuCpuLocale = "en"
): HardwareSuitabilityReport {
  return analyzeASTForHardware(ast, locale);
}
