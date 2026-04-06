import type {
  HardwareFeatures,
  DependencyProfile,
  PatternCandidate,
  HardwareScore,
  EvidenceItem,
  HardwareSuitabilityReport,
} from "../types";

interface VetoResult {
  target: "cpu" | "gpu";
  reason: string;
  evidence: EvidenceItem;
}

const VETO_RULES: Array<
  (f: HardwareFeatures, d: DependencyProfile) => VetoResult | null
> = [
  (f) =>
    f.hasWhile && f.dataDependentConditions > 0
      ? {
          target: "gpu",
          reason: "While loop with data-dependent condition",
          evidence: {
            kind: "veto",
            message:
              "WHILE loop with data-dependent condition inhibits GPU parallelism",
          },
        }
      : null,
  (f) =>
    f.hasEarlyReturn
      ? {
          target: "gpu",
          reason: "Early return inside loop",
          evidence: {
            kind: "veto",
            message:
              "Early return inside a loop (search/pruning) is incompatible with SIMD execution",
          },
        }
      : null,
  (f) =>
    f.loopCarriedDependencies > 0
      ? {
          target: "gpu",
          reason: "Loop-carried dependency",
          evidence: {
            kind: "veto",
            message: `Loop-carried dependency: ${f.loopCarriedDependencies} occurrence(s) — iteration N+1 depends on N`,
          },
        }
      : null,
  (f) =>
    f.indirectIndexedAccesses >= 2
      ? {
          target: "gpu",
          reason: "Indirect indexed access dominates",
          evidence: {
            kind: "veto",
            message: `${f.indirectIndexedAccesses} indirect A[B[i]] accesses reduce coalesced memory on GPU`,
          },
        }
      : null,
  (f) =>
    f.graphLikeTraversalSignals > 0 || f.pointerOrObjectAccesses > 2
      ? {
          target: "gpu",
          reason: "Graph/pointer traversal",
          evidence: {
            kind: "veto",
            message:
              "Graph traversal or pointer-chasing: irregular memory; not GPU-friendly",
          },
        }
      : null,
  (f) =>
    f.hasRecursion && f.recursiveFanOut <= 1 && f.hasEarlyReturn
      ? {
          target: "gpu",
          reason: "Unbalanced recursion with pruning",
          evidence: {
            kind: "veto",
            message:
              "Single-branch recursion with early exit is not GPU-suitable",
          },
        }
      : null,
];

function applyScoreBlocks(
  f: HardwareFeatures,
  d: DependencyProfile,
  patterns: PatternCandidate[],
): HardwareScore {
  let gpu = 50,
    cpu = 50,
    hybrid = 50;
  const top = patterns[0]?.name ?? "";

  // Parallelism
  if (f.mapLikeWrites > 0 && f.loopCarriedDependencies === 0) gpu += 30;
  if (f.nestedLoopDepth >= 2 && f.loopCarriedDependencies === 0 && !f.hasWhile)
    gpu += 20;
  if (f.hasDivideAndConquerShape && f.recursiveFanOut >= 2) {
    hybrid += 15;
    cpu += 10;
  }

  // Dependencies
  if (f.scalarReductions > 0) {
    gpu -= 10;
    hybrid += 5;
  }
  if (f.loopCarriedDependencies > 0) {
    gpu -= 30;
    cpu += 25;
  }
  if (top === "dynamic programming sequential") {
    gpu -= 35;
    cpu += 30;
  }

  // Control
  if (f.branchDensityInsideLoops > 0.5) {
    gpu -= 15;
    cpu += 10;
  }
  if (f.hasEarlyReturn) {
    gpu -= 20;
    cpu += 15;
  }
  if (f.hasWhile && f.dataDependentConditions > 0) {
    gpu -= 25;
    cpu += 20;
  }

  // Memory
  if (f.memoryRegularity === "regular") gpu += 15;
  if (f.stencilLikeAccesses > 0) gpu += 12;
  if (f.indirectIndexedAccesses > 0) {
    gpu -= 20;
    cpu += 10;
  }
  if (f.pointerOrObjectAccesses > 0) {
    gpu -= 25;
    cpu += 15;
  }

  // Granularity
  if (f.estimatedParallelWorkUnits === "low") gpu -= 15;
  else if (f.estimatedParallelWorkUnits === "medium") gpu += 10;
  else if (f.estimatedParallelWorkUnits === "high") gpu += 20;

  // Shape
  const shapeBoosts: Record<string, () => void> = {
    "divide and conquer balanced": () => {
      hybrid += 15;
    },
    "divide and conquer irregular": () => {
      cpu += 10;
      gpu -= 10;
    },
    "graph traversal": () => {
      cpu += 20;
    },
    backtracking: () => {
      cpu += 25;
    },
    "map element-wise": () => {
      gpu += 15;
    },
    stencil: () => {
      gpu += 12;
    },
    "nested rectangular loops": () => {
      gpu += 10;
    },
    reduction: () => {
      hybrid += 10;
    },
  };
  shapeBoosts[top]?.();

  if (f.hasRecursion && !f.hasDivideAndConquerShape) {
    cpu += 20;
    gpu -= 15;
  }

  gpu = Math.max(0, Math.min(100, gpu));
  cpu = Math.max(0, Math.min(100, cpu));
  hybrid = Math.max(0, Math.min(100, hybrid));

  // Confidence
  let confidence = 0.5;
  if (patterns.length > 0 && patterns[0].confidence >= 0.7) confidence += 0.2;
  if (d.globalRisk !== "unknown" && f.dependencyStrength !== "unknown")
    confidence += 0.15;
  if (f.memoryRegularity !== "unknown" && f.controlRegularity !== "unknown")
    confidence += 0.1;
  const unknownCount = [
    f.memoryRegularity,
    f.controlRegularity,
    f.dependencyStrength,
  ].filter((v) => v === "unknown").length;
  if (unknownCount >= 2) confidence -= 0.2;
  if (gpu > 60 && f.loopCarriedDependencies > 0) confidence -= 0.2;
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    gpu: Math.round(gpu),
    cpu: Math.round(cpu),
    hybrid: Math.round(hybrid),
    confidence,
  };
}

function pickVerdict(
  score: HardwareScore,
  vetoes: VetoResult[],
): HardwareSuitabilityReport["internalVerdict"] {
  const gpuVetoed = vetoes.some((v) => v.target === "gpu");
  if (gpuVetoed) {
    return score.hybrid > score.cpu + 10 ? "hybrid" : "cpu";
  }
  const sorted = (["gpu", "cpu", "hybrid"] as const)
    .map((k) => ({ k, v: score[k] }))
    .sort((a, b) => b.v - a.v);
  if (sorted[0].v - sorted[1].v < 12 && score.confidence < 0.55)
    return "inconclusive";
  return sorted[0].k;
}

export interface EngineOutput {
  score: HardwareScore;
  vetoes: VetoResult[];
  internalVerdict: HardwareSuitabilityReport["internalVerdict"];
  primaryRecommendation: HardwareSuitabilityReport["primaryRecommendation"];
  confidence: HardwareSuitabilityReport["confidence"];
  scores: HardwareSuitabilityReport["scores"];
  evidence: EvidenceItem[];
}

export function runEngine(input: {
  features: HardwareFeatures;
  deps: DependencyProfile;
  patterns: PatternCandidate[];
}): EngineOutput {
  const { features: f, deps: d, patterns } = input;
  const vetoes = VETO_RULES.map((r) => r(f, d)).filter(
    (v): v is VetoResult => v !== null,
  );
  const score = applyScoreBlocks(f, d, patterns);

  if (vetoes.some((v) => v.target === "gpu")) {
    score.gpu = Math.min(score.gpu, 35);
    score.cpu = Math.max(score.cpu, 60);
  }

  const internalVerdict = pickVerdict(score, vetoes);
  const primaryRecommendation: HardwareSuitabilityReport["primaryRecommendation"] =
    internalVerdict === "inconclusive" ? "cpu" : internalVerdict;
  const confLabel: HardwareSuitabilityReport["confidence"] =
    score.confidence >= 0.8
      ? "high"
      : score.confidence >= 0.6
        ? "medium"
        : "low";
  const evidence: EvidenceItem[] = vetoes.map((v) => v.evidence);

  return {
    score,
    vetoes,
    internalVerdict,
    primaryRecommendation,
    confidence: confLabel,
    scores: { cpu: score.cpu, gpu: score.gpu, hybrid: score.hybrid },
    evidence,
  };
}
