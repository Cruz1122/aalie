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
  Call,
  Return,
  Binary,
  Index,
  Field,
  Identifier,
} from "@aa/types";

import type { HardwareFeatures } from "../types";

interface ExtractionCtx {
  currentLoopDepth: number;
  insideLoop: boolean;
  insideTopLoop: boolean;
  functionName: string;
  loopCount: number;
  // counters
  nestedDepth: number;
  hasWhile: boolean;
  hasRepeat: boolean;
  hasEarlyReturn: boolean;
  hasBreakLike: boolean;
  branchInLoop: number;
  dataDependentConditions: number;
  scalarReductions: number;
  mapLikeWrites: number;
  stencilLike: number;
  indirectIndexed: number;
  pointerAccesses: number;
  graphLikeSignals: number;
  loopCarried: number;
  sequentialUpdates: number;
  recursiveCalls: number;
  recursiveFanOut: number;
  hasDivideAndConquer: boolean;
  hasRecursion: boolean;
  // for stencil detection: track last written targets
  _writtenTargets: Set<string>;
}

function mkCtx(functionName: string): ExtractionCtx {
  return {
    currentLoopDepth: 0,
    insideLoop: false,
    insideTopLoop: false,
    functionName,
    loopCount: 0,
    nestedDepth: 0,
    hasWhile: false,
    hasRepeat: false,
    hasEarlyReturn: false,
    hasBreakLike: false,
    branchInLoop: 0,
    dataDependentConditions: 0,
    scalarReductions: 0,
    mapLikeWrites: 0,
    stencilLike: 0,
    indirectIndexed: 0,
    pointerAccesses: 0,
    graphLikeSignals: 0,
    loopCarried: 0,
    sequentialUpdates: 0,
    recursiveCalls: 0,
    recursiveFanOut: 0,
    hasDivideAndConquer: false,
    hasRecursion: false,
    _writtenTargets: new Set(),
  };
}

/** Returns the string name of the outermost indexed target, or null */
function indexTargetName(node: Index): string | null {
  if (node.target && "name" in node.target)
    return (node.target as Identifier).name;
  return null;
}

/** Returns true if the binary has a constant ±1/±2 offset: A[i-1], A[j+1], etc. */
function isStencilIndex(indexNode: AstNode): boolean {
  if (indexNode.type !== "Binary") return false;
  const b = indexNode as Binary;
  if (b.op !== "+" && b.op !== "-") return false;
  return b.right.type === "Literal";
}

/** Detect indirect indexing: A[B[i]] */
function isIndirectIndex(indexNode: AstNode): boolean {
  return indexNode.type === "Index";
}

/** Check if the assignment is a scalar reduction: x = x + ... */
function detectScalarReduction(assign: Assign): boolean {
  const target = assign.target;
  if (target.type !== "Identifier") return false;
  const tName = (target as Identifier).name;
  const val = assign.value;
  if (val.type !== "Binary") return false;
  const bv = val as Binary;
  // x = x op e  OR x = e op x
  const leftIsTarget =
    bv.left.type === "Identifier" && (bv.left as Identifier).name === tName;
  const rightIsTarget =
    bv.right.type === "Identifier" && (bv.right as Identifier).name === tName;
  return (
    (leftIsTarget || rightIsTarget) &&
    ["+", "-", "*", "max", "min"].includes(bv.op)
  );
}

/** Check if the assignment is loop-carried: A[i] = f(A[i-1]) — target has same base as a stencil-read */
function detectLoopCarried(assign: Assign, _ctx: ExtractionCtx): boolean {
  const target = assign.target;
  if (target.type !== "Index") return false;
  const targetName = indexTargetName(target as Index);
  if (!targetName) return false;

  // Now check if the value expr reads from the *same* array with offset access
  function readsStencilFrom(node: AstNode, arrayName: string): boolean {
    if (node.type === "Index") {
      const n = node as Index;
      const nm = indexTargetName(n);
      if (nm === arrayName && n.index && isStencilIndex(n.index)) return true;
    }
    // Recurse
    const children = getChildren(node);
    return children.some((c) => readsStencilFrom(c, arrayName));
  }

  return readsStencilFrom(assign.value, targetName);
}

function getChildren(node: AstNode): AstNode[] {
  switch (node.type) {
    case "Binary":
      return [(node as Binary).left, (node as Binary).right];
    case "Assign":
      return [(node as Assign).target, (node as Assign).value];
    case "Index": {
      const idx = node as Index;
      const res: AstNode[] = [idx.target];
      if (idx.index) res.push(idx.index);
      return res;
    }
    case "Call":
      return (node as Call).args;
    case "Return":
      return (node as Return).value ? [(node as Return).value] : [];
    case "If": {
      const n = node as If;
      const r: AstNode[] = [n.test, ...n.consequent.body];
      if (n.alternate) r.push(...n.alternate.body);
      return r;
    }
    case "Block":
      return (node as Block).body;
    case "Field":
      return [(node as Field).target];
    default:
      return [];
  }
}

function visitNode(node: AstNode, ctx: ExtractionCtx): void {
  if (!node || typeof node !== "object") return;

  switch (node.type) {
    case "For": {
      const n = node as For;
      ctx.loopCount++;
      const wasInside = ctx.insideLoop;
      const wasTop = ctx.insideTopLoop;
      const prevDepth = ctx.currentLoopDepth;
      ctx.insideLoop = true;
      ctx.insideTopLoop = true;
      ctx.currentLoopDepth++;
      ctx.nestedDepth = Math.max(ctx.nestedDepth, ctx.currentLoopDepth);
      visitBlock(n.body, ctx);
      ctx.insideLoop = wasInside;
      ctx.insideTopLoop = wasTop;
      ctx.currentLoopDepth = prevDepth;
      break;
    }
    case "While": {
      const n = node as While;
      ctx.loopCount++;
      ctx.hasWhile = true;
      const wasInside = ctx.insideLoop;
      const wasTop = ctx.insideTopLoop;
      const prevDepth = ctx.currentLoopDepth;
      ctx.insideLoop = true;
      ctx.insideTopLoop = !wasInside; // top-level while only if not already in loop
      ctx.currentLoopDepth++;
      ctx.nestedDepth = Math.max(ctx.nestedDepth, ctx.currentLoopDepth);
      // Check if condition uses a variable modified inside by inspecting after
      ctx.dataDependentConditions++;
      visitBlock(n.body, ctx);
      ctx.insideLoop = wasInside;
      ctx.insideTopLoop = wasTop;
      ctx.currentLoopDepth = prevDepth;
      break;
    }
    case "Repeat": {
      const n = node as Repeat;
      ctx.loopCount++;
      ctx.hasRepeat = true;
      const wasInside = ctx.insideLoop;
      const prevDepth = ctx.currentLoopDepth;
      ctx.insideLoop = true;
      ctx.currentLoopDepth++;
      ctx.nestedDepth = Math.max(ctx.nestedDepth, ctx.currentLoopDepth);
      visitBlock(n.body, ctx);
      ctx.insideLoop = wasInside;
      ctx.currentLoopDepth = prevDepth;
      break;
    }
    case "If": {
      const n = node as If;
      if (ctx.insideLoop) ctx.branchInLoop++;
      visitBlock(n.consequent, ctx);
      if (n.alternate) visitBlock(n.alternate, ctx);
      break;
    }
    case "Assign": {
      const n = node as Assign;
      if (ctx.insideLoop) {
        if (detectScalarReduction(n)) {
          ctx.scalarReductions++;
        }
        if (n.target.type === "Index") {
          const idxTarget = n.target as Index;
          const nm = indexTargetName(idxTarget);
          // Check if index is stencil-like (A[i+1] = ...)
          if (idxTarget.index && isStencilIndex(idxTarget.index)) {
            ctx.stencilLike++;
          } else if (idxTarget.index && isIndirectIndex(idxTarget.index)) {
            ctx.indirectIndexed++;
          } else {
            ctx.mapLikeWrites++;
          }
          if (nm) ctx._writtenTargets.add(nm);
        } else if (n.target.type === "Field") {
          ctx.pointerAccesses++;
        }
        if (detectLoopCarried(n, ctx)) {
          ctx.loopCarried++;
          // Not map-like if loop-carried
          if (ctx.mapLikeWrites > 0) ctx.mapLikeWrites--;
        }
      }
      visitNode(n.value, ctx);
      break;
    }
    case "Return": {
      const n = node as Return;
      if (ctx.insideLoop) ctx.hasEarlyReturn = true;
      if (n.value) visitNode(n.value, ctx);
      break;
    }
    case "Call": {
      const n = node as Call;
      if (n.callee === ctx.functionName) {
        ctx.recursiveCalls++;
      }
      // Detect graph-like: push/pop/enqueue/dequeue of queues/stacks
      const graphKeywords = [
        "push",
        "pop",
        "enqueue",
        "dequeue",
        "append",
        "addEdge",
        "getNeighbors",
      ];
      if (
        graphKeywords.some((k) =>
          n.callee.toLowerCase().includes(k.toLowerCase()),
        )
      ) {
        ctx.graphLikeSignals++;
      }
      for (const arg of n.args) visitNode(arg, ctx);
      break;
    }
    case "Field": {
      ctx.pointerAccesses++;
      visitNode((node as Field).target, ctx);
      break;
    }
    case "Index": {
      const n = node as Index;
      if (n.index && isIndirectIndex(n.index)) ctx.indirectIndexed++;
      visitNode(n.target, ctx);
      if (n.index) visitNode(n.index, ctx);
      break;
    }
    default:
      for (const child of getChildren(node)) visitNode(child, ctx);
  }
}

function visitBlock(block: Block, ctx: ExtractionCtx): void {
  for (const stmt of block.body) visitNode(stmt, ctx);
}

function detectDivideAndConquer(procDef: ProcDef, ctx: ExtractionCtx): boolean {
  // Divide-and-conquer: 2+ recursive calls inside If with a base case pattern
  return ctx.recursiveCalls >= 2;
}

function estimateWorkUnits(
  ctx: ExtractionCtx,
): "low" | "medium" | "high" | "unknown" {
  const totalOps =
    ctx.mapLikeWrites +
    ctx.scalarReductions +
    ctx.stencilLike +
    ctx.loopCarried;
  const depth = ctx.nestedDepth;
  if (depth >= 2 || totalOps >= 10) return "high";
  if (totalOps >= 3 || depth >= 1) return "medium";
  if (ctx.loopCount === 0) return "low";
  return "unknown";
}

function classifyControlRegularity(
  ctx: ExtractionCtx,
): "regular" | "mixed" | "irregular" | "unknown" {
  if (ctx.loopCount === 0 && !ctx.hasWhile) return "unknown";
  const branchRatio = ctx.loopCount > 0 ? ctx.branchInLoop / ctx.loopCount : 0;
  if (ctx.hasEarlyReturn || branchRatio > 0.6 || ctx.hasBreakLike)
    return "irregular";
  if (branchRatio > 0.3 || ctx.hasWhile) return "mixed";
  return "regular";
}

function classifyMemoryRegularity(
  ctx: ExtractionCtx,
): "regular" | "mixed" | "irregular" | "unknown" {
  const total =
    ctx.mapLikeWrites +
    ctx.stencilLike +
    ctx.indirectIndexed +
    ctx.pointerAccesses;
  if (total === 0) return "unknown";
  const irregular = ctx.indirectIndexed + ctx.pointerAccesses;
  const regular = ctx.mapLikeWrites + ctx.stencilLike;
  if (irregular === 0) return "regular";
  if (regular === 0 && irregular > 0) return "irregular";
  return "mixed";
}

function classifyDependencyStrength(
  ctx: ExtractionCtx,
): "none" | "weak" | "medium" | "strong" | "unknown" {
  if (ctx.loopCount === 0 && !ctx.hasRecursion) return "unknown";
  if (ctx.loopCarried >= 2 || (ctx.loopCarried > 0 && ctx.hasWhile))
    return "strong";
  if (ctx.loopCarried === 1 || ctx.scalarReductions > 1) return "medium";
  if (ctx.scalarReductions === 1) return "weak";
  return "none";
}

export function extractFeatures(ast: Program): HardwareFeatures {
  // Determine algo kind
  let hasRecursion = false;
  let recursiveFanOut = 0;
  let hasDivideAndConquer = false;
  let topLevelLoops = 0;

  const allCtxs: ExtractionCtx[] = [];

  for (const node of ast.body) {
    if (node.type === "ProcDef") {
      const procDef = node as ProcDef;
      const ctx = mkCtx(procDef.name);
      visitBlock(procDef.body, ctx);
      if (ctx.recursiveCalls > 0) {
        hasRecursion = true;
        recursiveFanOut = Math.max(recursiveFanOut, ctx.recursiveCalls);
        hasDivideAndConquer = detectDivideAndConquer(procDef, ctx);
      }
      // Count for loops at block root (top-level in procedures)
      topLevelLoops += procDef.body.body.filter(
        (s) => s.type === "For" || s.type === "While" || s.type === "Repeat",
      ).length;
      allCtxs.push(ctx);
    }
  }

  // Merge all contexts
  const merged = allCtxs.reduce((acc, c) => {
    acc.loopCount += c.loopCount;
    acc.nestedDepth = Math.max(acc.nestedDepth, c.nestedDepth);
    acc.hasWhile = acc.hasWhile || c.hasWhile;
    acc.hasRepeat = acc.hasRepeat || c.hasRepeat;
    acc.hasEarlyReturn = acc.hasEarlyReturn || c.hasEarlyReturn;
    acc.hasBreakLike = acc.hasBreakLike || c.hasBreakLike;
    acc.branchInLoop += c.branchInLoop;
    acc.dataDependentConditions += c.dataDependentConditions;
    acc.scalarReductions += c.scalarReductions;
    acc.mapLikeWrites += c.mapLikeWrites;
    acc.stencilLike += c.stencilLike;
    acc.indirectIndexed += c.indirectIndexed;
    acc.pointerAccesses += c.pointerAccesses;
    acc.graphLikeSignals += c.graphLikeSignals;
    acc.loopCarried += c.loopCarried;
    acc.sequentialUpdates += c.sequentialUpdates;
    acc.recursiveCalls += c.recursiveCalls;
    acc.hasRecursion = acc.hasRecursion || c.hasRecursion;
    return acc;
  }, mkCtx(""));

  merged.hasRecursion = hasRecursion;
  const algorithmKind: HardwareFeatures["algorithmKind"] =
    hasRecursion && merged.loopCount > 0
      ? "hybrid"
      : hasRecursion
        ? "recursive"
        : merged.loopCount > 0
          ? "iterative"
          : "unknown";

  const branchDensity =
    merged.loopCount > 0 ? merged.branchInLoop / merged.loopCount : 0;

  return {
    algorithmKind,
    topLevelLoops,
    nestedLoopDepth: merged.nestedDepth,
    hasWhile: merged.hasWhile,
    hasRepeat: merged.hasRepeat,
    hasRecursion,
    recursiveFanOut,
    hasDivideAndConquerShape: hasDivideAndConquer,
    hasEarlyReturn: merged.hasEarlyReturn,
    hasBreakLikeExit: merged.hasBreakLike,
    branchDensityInsideLoops: branchDensity,
    dataDependentConditions: merged.dataDependentConditions,
    scalarReductions: merged.scalarReductions,
    mapLikeWrites: merged.mapLikeWrites,
    stencilLikeAccesses: merged.stencilLike,
    indirectIndexedAccesses: merged.indirectIndexed,
    pointerOrObjectAccesses: merged.pointerAccesses,
    graphLikeTraversalSignals: merged.graphLikeSignals,
    loopCarriedDependencies: merged.loopCarried,
    sequentialStateUpdates: merged.sequentialUpdates,
    estimatedParallelWorkUnits: estimateWorkUnits(merged),
    memoryRegularity: classifyMemoryRegularity(merged),
    controlRegularity: classifyControlRegularity(merged),
    dependencyStrength: classifyDependencyStrength(merged),
  };
}
