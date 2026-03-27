import type {
  HardwareFeatures,
  DependencyProfile,
  PatternCandidate,
} from "../types";

export type PatternName =
  | "map element-wise"
  | "reduction"
  | "prefix scan"
  | "stencil"
  | "nested rectangular loops"
  | "search with early exit"
  | "dynamic programming sequential"
  | "in-place sorting"
  | "divide and conquer balanced"
  | "divide and conquer irregular"
  | "graph traversal"
  | "tree traversal"
  | "pointer chasing"
  | "branch-heavy filtering"
  | "backtracking"
  | "mixed pipeline";

interface PatternRule {
  name: PatternName;
  detect(
    f: HardwareFeatures,
    d: DependencyProfile,
  ): { match: boolean; evidence: string[] };
}

const PATTERN_RULES: PatternRule[] = [
  {
    name: "map element-wise",
    detect(f, d) {
      const evidence: string[] = [];
      const allMapLike =
        d.loops.length > 0 && d.loops.every((l) => l.isMapLike);
      const noLoopCarried = d.loops.every((l) => !l.hasLoopCarriedDependency);
      const noEarlyReturn = !f.hasEarlyReturn;
      if (allMapLike)
        evidence.push("All loops write to array with independent index");
      if (noLoopCarried) evidence.push("No loop-carried dependencies detected");
      if (f.mapLikeWrites > 0)
        evidence.push(`${f.mapLikeWrites} map-like write(s) found`);
      return {
        match:
          allMapLike &&
          noLoopCarried &&
          noEarlyReturn &&
          f.mapLikeWrites > 0 &&
          !f.hasRecursion,
        evidence,
      };
    },
  },
  {
    name: "reduction",
    detect(f, d) {
      const evidence: string[] = [];
      const hasReductions = f.scalarReductions > 0;
      const loopsHaveAccumulators = d.loops.some(
        (l) => l.accumulators.length > 0,
      );
      const parallelReduceLoops = d.loops.some(
        (l) => l.classification === "parallel_with_reduction",
      );
      if (hasReductions)
        evidence.push(`${f.scalarReductions} scalar reduction(s) detected`);
      if (loopsHaveAccumulators)
        evidence.push("Accumulator pattern in loop body");
      if (parallelReduceLoops)
        evidence.push("Loop classified as parallel_with_reduction");
      return {
        match:
          hasReductions &&
          (loopsHaveAccumulators || parallelReduceLoops) &&
          !f.hasEarlyReturn,
        evidence,
      };
    },
  },
  {
    name: "stencil",
    detect(f, _d) {
      const evidence: string[] = [];
      if (f.stencilLikeAccesses > 0)
        evidence.push(
          `${f.stencilLikeAccesses} stencil-like access(es) (A[i±k]) detected`,
        );
      const isStencil =
        f.stencilLikeAccesses > 0 && f.mapLikeWrites > 0 && !f.hasEarlyReturn;
      return { match: isStencil, evidence };
    },
  },
  {
    name: "search with early exit",
    detect(f, _d) {
      const evidence: string[] = [];
      if (f.hasEarlyReturn)
        evidence.push("Return statement found inside a loop");
      if (f.hasEarlyReturn && f.loopCarriedDependencies === 0)
        evidence.push("No loop-carried dependency; search-like traversal");
      return {
        match: f.hasEarlyReturn && f.loopCarriedDependencies === 0,
        evidence,
      };
    },
  },
  {
    name: "dynamic programming sequential",
    detect(f, d) {
      const evidence: string[] = [];
      const sequentialLoops = d.loops.filter(
        (l) => l.classification === "sequential_by_dependency",
      );
      if (f.loopCarriedDependencies > 0)
        evidence.push(
          `${f.loopCarriedDependencies} loop-carried dependenc(ies) found`,
        );
      if (sequentialLoops.length > 0)
        evidence.push(
          `${sequentialLoops.length} loop(s) classified as sequential_by_dependency`,
        );
      return {
        match:
          sequentialLoops.length > 0 &&
          f.loopCarriedDependencies > 0 &&
          !f.hasRecursion,
        evidence,
      };
    },
  },
  {
    name: "nested rectangular loops",
    detect(f, d) {
      const evidence: string[] = [];
      const allParallel =
        d.loops.length >= 2 &&
        d.loops.every(
          (l) =>
            l.classification === "embarrassingly_parallel" ||
            l.classification === "parallel_with_reduction",
        );
      if (f.nestedLoopDepth >= 2)
        evidence.push(`Nested loop depth: ${f.nestedLoopDepth}`);
      if (allParallel)
        evidence.push("All nested loops appear to be data-parallel");
      return {
        match: f.nestedLoopDepth >= 2 && allParallel && !f.hasWhile,
        evidence,
      };
    },
  },
  {
    name: "in-place sorting",
    detect(f, d) {
      const evidence: string[] = [];
      const hasCompareSwap =
        d.loops.length >= 1 &&
        f.mapLikeWrites > 0 &&
        f.branchDensityInsideLoops > 0.3;
      if (hasCompareSwap)
        evidence.push(
          "Compare-and-swap pattern (array writes + conditionals in loops)",
        );
      if (f.nestedLoopDepth >= 2)
        evidence.push("Nested loops found (characteristic of O(n²) sorts)");
      return {
        match:
          hasCompareSwap &&
          !f.hasRecursion &&
          !f.hasEarlyReturn &&
          f.nestedLoopDepth >= 2,
        evidence,
      };
    },
  },
  {
    name: "divide and conquer balanced",
    detect(f, _d) {
      const evidence: string[] = [];
      if (f.hasDivideAndConquerShape)
        evidence.push("Two or more recursive calls detected");
      if (f.recursiveFanOut >= 2)
        evidence.push(`Recursive fan-out: ${f.recursiveFanOut}`);
      if (f.loopCarriedDependencies === 0)
        evidence.push("No sequential cross-call dependencies");
      return {
        match:
          f.hasDivideAndConquerShape &&
          f.recursiveFanOut >= 2 &&
          f.indirectIndexedAccesses === 0,
        evidence,
      };
    },
  },
  {
    name: "divide and conquer irregular",
    detect(f, _d) {
      const evidence: string[] = [];
      if (f.hasDivideAndConquerShape) evidence.push("Recursive divide pattern");
      if (f.hasEarlyReturn)
        evidence.push("Early return (irregular base case / pruning)");
      if (f.branchDensityInsideLoops > 0.5)
        evidence.push("High branch density indicates irregular partitioning");
      return {
        match:
          f.hasDivideAndConquerShape &&
          (f.hasEarlyReturn || f.branchDensityInsideLoops > 0.5),
        evidence,
      };
    },
  },
  {
    name: "graph traversal",
    detect(f, _d) {
      const evidence: string[] = [];
      if (f.graphLikeTraversalSignals > 0)
        evidence.push(
          `${f.graphLikeTraversalSignals} graph-like call(s) (push/pop/enqueue/etc)`,
        );
      if (f.pointerOrObjectAccesses > 0)
        evidence.push(`${f.pointerOrObjectAccesses} pointer/field access(es)`);
      return {
        match:
          f.graphLikeTraversalSignals > 0 ||
          (f.pointerOrObjectAccesses > 0 && f.hasWhile),
        evidence,
      };
    },
  },
  {
    name: "pointer chasing",
    detect(f, _d) {
      const evidence: string[] = [];
      if (f.pointerOrObjectAccesses > 0)
        evidence.push(
          `${f.pointerOrObjectAccesses} field/pointer access(es) detected`,
        );
      if (f.hasWhile)
        evidence.push("While loop with likely pointer-driven condition");
      return {
        match:
          f.pointerOrObjectAccesses > 0 &&
          f.hasWhile &&
          f.graphLikeTraversalSignals === 0,
        evidence,
      };
    },
  },
  {
    name: "branch-heavy filtering",
    detect(f, _d) {
      const evidence: string[] = [];
      if (f.branchDensityInsideLoops > 0.5)
        evidence.push(
          `Branch density: ${(f.branchDensityInsideLoops * 100).toFixed(0)}%`,
        );
      return {
        match:
          f.branchDensityInsideLoops > 0.5 &&
          !f.hasRecursion &&
          f.loopCarriedDependencies === 0,
        evidence,
      };
    },
  },
  {
    name: "backtracking",
    detect(f, d) {
      const evidence: string[] = [];
      const deepRecursionWithBranch =
        f.hasRecursion && f.hasEarlyReturn && f.branchDensityInsideLoops > 0.3;
      const highFanOut = f.recursiveFanOut >= 2 && d.globalRisk === "high";
      if (deepRecursionWithBranch)
        evidence.push("Early return in recursive context suggests pruning");
      if (highFanOut)
        evidence.push("High-fan-out recursion with sequential dependency risk");
      return { match: deepRecursionWithBranch || highFanOut, evidence };
    },
  },
  {
    name: "mixed pipeline",
    detect(f, d) {
      const evidence: string[] = [];
      const hasMap = f.mapLikeWrites > 0;
      const hasSeq = d.loops.some(
        (l) => l.classification === "sequential_by_dependency",
      );
      if (hasMap && hasSeq)
        evidence.push("Mix of map-like and sequential loops detected");
      return { match: hasMap && hasSeq, evidence };
    },
  },
];

export function detectPatterns(
  features: HardwareFeatures,
  deps: DependencyProfile,
): PatternCandidate[] {
  const results: PatternCandidate[] = [];

  for (const rule of PATTERN_RULES) {
    const { match, evidence } = rule.detect(features, deps);
    if (match) {
      // Compute per-rule confidence based on evidence count and feature clarity
      const baseConf = 0.5 + Math.min(evidence.length * 0.1, 0.4);
      results.push({
        name: rule.name,
        confidence: Math.min(1.0, baseConf),
        evidence,
      });
    }
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}
