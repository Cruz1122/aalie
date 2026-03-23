/**
 * gpu-cpu-analyzer.ts
 * Shim: delegates to the deterministic hardware analyzer.
 */

import type { Program } from "@aa/types";

import type { GpuCpuLocale } from "./gpu-cpu-texts";
import { analyzeASTForHardware } from "./hardware/index";

import type { HardwareSuitabilityReport } from "./hardware/types";

export type { HardwareSuitabilityReport };

/**
 * Entry compatible with the original frontend API.
 */
export function analyzeASTForGPUCPU(
  ast: Program,
  locale: GpuCpuLocale = "en",
): HardwareSuitabilityReport {
  return analyzeASTForHardware(ast, locale);
}

