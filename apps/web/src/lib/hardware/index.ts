import type { Program } from "@aa/types";

import { analyzeDependencies } from "./dependencies/analyzer";
import { buildExplanations } from "./explanations/builder";
import { extractFeatures } from "./features/extractor";
import { detectPatterns } from "./patterns/detector";
import { runEngine } from "./scoring/engine";
import type { HardwareSuitabilityReport } from "./types";

type Locale = "en" | "es";

/**
 * Entry point: deterministic hardware suitability analysis from an AST.
 */
export function analyzeASTForHardware(
  ast: Program,
  locale: Locale = "en",
): HardwareSuitabilityReport {
  // Layer 1: Feature extraction
  const features = extractFeatures(ast);

  // Layer 2: Dependency analysis
  const deps = analyzeDependencies(ast);

  // Layer 3: Pattern detection
  const patterns = detectPatterns(features, deps);

  // Layer 4: Scoring + decision engine
  const engine = runEngine({ features, deps, patterns });

  // Layer 5: Explanations
  const explanations = buildExplanations(
    features,
    deps,
    patterns,
    engine,
    locale,
  );

  return {
    primaryRecommendation: engine.primaryRecommendation,
    internalVerdict: engine.internalVerdict,
    confidence: engine.confidence,
    scores: engine.scores,
    summary: explanations.summary,
    reasons: explanations.reasons,
    detectedPatterns: patterns.map((p) => ({
      name: p.name,
      confidence: p.confidence,
      evidence: p.evidence,
    })),
    evidence: explanations.evidence,
    diagnostics: explanations.diagnostics,
  };
}

export type { HardwareSuitabilityReport };
