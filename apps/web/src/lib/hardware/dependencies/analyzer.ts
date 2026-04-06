import type {
  Program,
  AstNode,
  ProcDef,
  Block,
  For,
  While,
  Repeat,
  If,
  Assign,
  Binary,
  Index,
  Identifier,
} from "@aa/types";

import type {
  DependencyProfile,
  LoopDependencySummary,
  RecursionDependencySummary,
} from "../types";

interface LoopScope {
  id: string;
  reads: Set<string>;
  writes: Set<string>;
  accumulators: Set<string>;
  mapLikeTargets: Set<string>;
  hasLoopCarried: boolean;
  hasDataDependentControl: boolean;
  hasEarlyReturn: boolean;
}

function mkLoopScope(id: string): LoopScope {
  return {
    id,
    reads: new Set(),
    writes: new Set(),
    accumulators: new Set(),
    mapLikeTargets: new Set(),
    hasLoopCarried: false,
    hasDataDependentControl: false,
    hasEarlyReturn: false,
  };
}

function isAstRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function collectReads(node: AstNode, reads: Set<string>): void {
  if (!node || typeof node !== "object") return;
  switch (node.type) {
    case "Identifier":
      reads.add((node as Identifier).name);
      break;
    case "Binary": {
      const b = node as Binary;
      collectReads(b.left, reads);
      collectReads(b.right, reads);
      break;
    }
    case "Index": {
      const idx = node as Index;
      collectReads(idx.target, reads);
      if (idx.index) collectReads(idx.index, reads);
      break;
    }
    case "Call": {
      for (const arg of (node as { args: AstNode[] }).args)
        collectReads(arg, reads);
      break;
    }
    default:
      break;
  }
}

function isLoopCarried(assign: Assign): boolean {
  const target = assign.target;
  if (target.type !== "Index") return false;
  const tName =
    target.type === "Index" &&
    "target" in target &&
    (target as Index).target.type === "Identifier"
      ? ((target as Index).target as Identifier).name
      : null;
  if (!tName) return false;

  function hasStencilRead(node: AstNode, name: string): boolean {
    if (node.type === "Index") {
      const n = node as Index;
      if (
        n.target.type === "Identifier" &&
        (n.target as Identifier).name === name
      ) {
        if (n.index && n.index.type === "Binary") {
          const b = n.index as Binary;
          if ((b.op === "+" || b.op === "-") && b.right.type === "Literal")
            return true;
        }
      }
    }
    if ("left" in node && "right" in node) {
      const b = node as Binary;
      return hasStencilRead(b.left, name) || hasStencilRead(b.right, name);
    }
    return false;
  }

  return hasStencilRead(assign.value, tName);
}

function isScalarAccumulator(assign: Assign): boolean {
  if (assign.target.type !== "Identifier") return false;
  const name = (assign.target as Identifier).name;
  const v = assign.value;
  if (v.type !== "Binary") return false;
  const b = v as Binary;
  const lId = b.left.type === "Identifier" && (b.left as Identifier).name;
  const rId = b.right.type === "Identifier" && (b.right as Identifier).name;
  return lId === name || rId === name;
}

function analyzeLoopBody(body: Block, scope: LoopScope, fnName: string): void {
  for (const stmt of body.body) {
    analyzeStmt(stmt, scope, fnName);
  }
}

function analyzeStmt(node: AstNode, scope: LoopScope, fnName: string): void {
  if (!node) return;
  switch (node.type) {
    case "Assign": {
      const a = node as Assign;
      // Track writes
      if (a.target.type === "Identifier") {
        const name = (a.target as Identifier).name;
        scope.writes.add(name);
        if (isScalarAccumulator(a)) scope.accumulators.add(name);
      } else if (a.target.type === "Index") {
        const idxNode = a.target as Index;
        if (idxNode.target.type === "Identifier") {
          const name = (idxNode.target as Identifier).name;
          scope.writes.add(name);
          scope.mapLikeTargets.add(name);
        }
        // Check loop-carried
        if (isLoopCarried(a)) {
          scope.hasLoopCarried = true;
        }
      }
      // Track reads from value
      collectReads(a.value, scope.reads);
      break;
    }
    case "Return":
      scope.hasEarlyReturn = true;
      break;
    case "If": {
      const n = node as If;
      collectReads(n.test, scope.reads);
      // Condition inside loop that reads from written vars = data-dependent control
      const condReads = new Set<string>();
      collectReads(n.test, condReads);
      if ([...condReads].some((r) => scope.writes.has(r))) {
        scope.hasDataDependentControl = true;
      }
      analyzeLoopBody(n.consequent, scope, fnName);
      if (n.alternate) analyzeLoopBody(n.alternate, scope, fnName);
      break;
    }
    case "For": {
      const n = node as For;
      analyzeLoopBody(n.body, scope, fnName);
      break;
    }
    case "While": {
      const n = node as While;
      scope.hasDataDependentControl = true;
      analyzeLoopBody(n.body, scope, fnName);
      break;
    }
    case "Repeat": {
      const n = node as Repeat;
      analyzeLoopBody(n.body, scope, fnName);
      break;
    }
    default:
      break;
  }
}

function classifyLoop(
  scope: LoopScope,
): LoopDependencySummary["classification"] {
  if (scope.hasLoopCarried) return "sequential_by_dependency";
  if (scope.hasEarlyReturn && scope.mapLikeTargets.size === 0)
    return "sequential_by_dependency";
  if (scope.accumulators.size > 0 && !scope.hasLoopCarried)
    return "parallel_with_reduction";
  if (
    scope.mapLikeTargets.size > 0 &&
    scope.accumulators.size === 0 &&
    !scope.hasLoopCarried
  ) {
    return "embarrassingly_parallel";
  }
  if (scope.mapLikeTargets.size > 0 || scope.accumulators.size > 0)
    return "weakly_parallel";
  return "unknown";
}

let _loopCounter = 0;

function visitLoops(
  body: Block,
  loops: LoopDependencySummary[],
  fnName: string,
): void {
  for (const stmt of body.body) {
    if (
      stmt.type === "For" ||
      stmt.type === "While" ||
      stmt.type === "Repeat"
    ) {
      const id = `loop_${++_loopCounter}`;
      const scope = mkLoopScope(id);
      const loopBody =
        stmt.type === "Repeat"
          ? (stmt as Repeat).body
          : (stmt as For | While).body;
      analyzeLoopBody(loopBody, scope, fnName);
      const classification = classifyLoop(scope);
      loops.push({
        loopId: id,
        variablesRead: [...scope.reads],
        variablesWritten: [...scope.writes],
        accumulators: [...scope.accumulators],
        isMapLike:
          scope.mapLikeTargets.size > 0 &&
          !scope.hasLoopCarried &&
          classification !== "sequential_by_dependency",
        hasLoopCarriedDependency: scope.hasLoopCarried,
        hasDataDependentControl: scope.hasDataDependentControl,
        classification,
      });
      // recurse into nested loops
      visitLoops(loopBody, loops, fnName);
    } else if (stmt.type === "If") {
      const n = stmt as If;
      visitLoops(n.consequent, loops, fnName);
      if (n.alternate) visitLoops(n.alternate, loops, fnName);
    }
  }
}

export function analyzeDependencies(ast: Program): DependencyProfile {
  _loopCounter = 0;
  const loops: LoopDependencySummary[] = [];
  const recursion: RecursionDependencySummary[] = [];

  for (const node of ast.body) {
    if (node.type === "ProcDef") {
      const proc = node as ProcDef;
      visitLoops(proc.body, loops, proc.name);

      // Detect recursion shape
      let recursiveCalls = 0;
      let hasReturnAfterCalls = false;

      function scanForRecursion(n: unknown): void {
        if (!isAstRecord(n) || typeof n.type !== "string") return;
        if (
          n.type === "Call" &&
          (n as { callee: string }).callee === proc.name
        ) {
          recursiveCalls++;
        }
        if (n.type === "Return") hasReturnAfterCalls = recursiveCalls > 0;
        if (
          "body" in n &&
          isAstRecord(n.body) &&
          "body" in n.body &&
          Array.isArray(n.body.body)
        ) {
          for (const child of n.body.body) scanForRecursion(child);
        }
        if (
          "consequent" in n &&
          isAstRecord(n.consequent) &&
          Array.isArray(n.consequent.body)
        ) {
          for (const child of n.consequent.body) scanForRecursion(child);
          if (
            "alternate" in n &&
            n.alternate &&
            isAstRecord(n.alternate) &&
            Array.isArray(n.alternate.body)
          )
            for (const child of n.alternate.body) scanForRecursion(child);
        }
        if ("args" in n && Array.isArray(n.args)) {
          for (const arg of n.args) scanForRecursion(arg);
        }
        if ("value" in n && n.value) {
          scanForRecursion(n.value);
        }
        if ("left" in n && "right" in n) {
          scanForRecursion(n.left);
          scanForRecursion(n.right);
        }
      }
      for (const stmt of proc.body.body) scanForRecursion(stmt);

      if (recursiveCalls > 0) {
        recursion.push({
          functionName: proc.name,
          independentBranches: recursiveCalls >= 2,
          sequentialMerge: hasReturnAfterCalls && recursiveCalls >= 2,
        });
      }
    }
  }

  // Global risk
  const hasSequential = loops.some(
    (l) => l.classification === "sequential_by_dependency",
  );
  const hasUnknown = loops.some((l) => l.classification === "unknown");
  const globalRisk: DependencyProfile["globalRisk"] = hasSequential
    ? "high"
    : hasUnknown
      ? "medium"
      : loops.length > 0
        ? "low"
        : "unknown";

  return { loops, recursion, globalRisk };
}
