import type {
  Assign,
  AstNode,
  Block,
  Call,
  If,
  Program,
  Return,
} from "@aa/types";

import type { AstEvidenceMap, AstSignals, LoopAstNode } from "./techniqueTypes";

const INITIAL_SIGNALS: AstSignals = {
  totalNodes: 0,
  loopCount: 0,
  recursiveCallCount: 0,

  hasSelfCall: false,
  hasMultipleSelfCalls: false,
  hasSingleSelfCall: false,

  hasDivideArgument: false,
  hasMinusArgument: false,
  hasRangeSplit: false,
  hasMidpointComputation: false,

  hasIndexedReadBeforeRecursiveCall: false,
  hasIndexedWriteAfterRecursiveCall: false,
  hasIterativeIndexedWrites: false,
  hasPreviousStateDependency: false,

  hasCandidateMutation: false,
  hasUndoAfterRecursiveCall: false,
  hasFeasibilityCondition: false,
  hasPruningReturn: false,
  hasBoundComparison: false,

  hasLocalSelection: false,
  hasCommittedSelection: false,
  evidence: createEmptyEvidenceMap(),
};

type VisitContext = {
  currentProcedureName: string | null;
  loopDepth: number;
  loopStack: LoopAstNode[];
};

type SubtreeSummary = {
  hasSelfCall: boolean;
  selfCallCount: number;
  hasIndexedRead: boolean;
  hasIndexedWrite: boolean;
  hasCandidateMutation: boolean;
  hasUndoMutation: boolean;
  hasPruningReturn: boolean;
  hasBoundComparison: boolean;
  hasLocalSelection: boolean;
  hasDivision: boolean;
  hasSubtraction: boolean;
  hasAddition: boolean;
  hasMidpointLike: boolean;
  hasPreviousStateDependency: boolean;
};

const EMPTY_SUMMARY: SubtreeSummary = {
  hasSelfCall: false,
  selfCallCount: 0,
  hasIndexedRead: false,
  hasIndexedWrite: false,
  hasCandidateMutation: false,
  hasUndoMutation: false,
  hasPruningReturn: false,
  hasBoundComparison: false,
  hasLocalSelection: false,
  hasDivision: false,
  hasSubtraction: false,
  hasAddition: false,
  hasMidpointLike: false,
  hasPreviousStateDependency: false,
};

export function extractAstSignals(ast: Program | null | undefined): AstSignals {
  if (!ast) {
    return {
      ...INITIAL_SIGNALS,
      evidence: createEmptyEvidenceMap(),
    };
  }

  const signals: AstSignals = {
    ...INITIAL_SIGNALS,
    evidence: createEmptyEvidenceMap(),
  };

  visitNode(ast, signals, {
    currentProcedureName: null,
    loopDepth: 0,
    loopStack: [],
  });

  signals.hasSelfCall = signals.recursiveCallCount > 0;
  signals.hasSingleSelfCall = signals.recursiveCallCount === 1;
  signals.hasMultipleSelfCalls = signals.recursiveCallCount >= 2;
  signals.hasCommittedSelection =
    signals.hasLocalSelection && !signals.hasUndoAfterRecursiveCall;

  return signals;
}

function createEmptyEvidenceMap(): AstEvidenceMap {
  return {
    firstLoop: null,
    nestedLoop: null,
    singleRecursive: null,
    multipleRecursive: null,
    divideAndConquer: null,
    memoization: null,
    bottomUp: null,
    search: null,
    branchAndBound: null,
    greedy: null,
  };
}

function visitNode(
  node: AstNode,
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  signals.totalNodes += 1;

  switch (node.type) {
    case "Program":
      return visitProgram(node, signals, context);
    case "ProcDef":
      return visitNode(node.body, signals, {
        currentProcedureName: node.name,
        loopDepth: context.loopDepth,
        loopStack: context.loopStack,
      });
    case "Block":
      return visitBlock(node, signals, context);
    case "For":
      return visitLoop(node, signals, context);
    case "While":
      return visitLoop(node, signals, context);
    case "Repeat":
      return visitLoop(node, signals, context);
    case "If":
      return visitIf(node, signals, context);
    case "Assign":
      return visitAssign(node, signals, context);
    case "Return":
      return visitReturn(node, signals, context);
    case "Print":
      return visitMany(node.args, signals, context);
    case "Call":
      return visitCall(node, signals, context);
    case "Binary":
      return visitBinary(node, signals, context);
    case "Unary":
      return visitNode(node.arg, signals, context);
    case "Index":
      return visitIndex(node, signals, context);
    case "Field":
      return visitNode(node.target, signals, context);
    case "DeclVector":
      return visitMany(node.dims, signals, context);
    case "ArrayParam": {
      const endSummary = node.end
        ? visitNode(node.end, signals, context)
        : EMPTY_SUMMARY;
      return mergeSummaries(
        visitNode(node.start, signals, context),
        endSummary,
      );
    }
    case "Literal":
    case "Identifier":
    case "Param":
    case "ObjectParam":
      return EMPTY_SUMMARY;
    default:
      return EMPTY_SUMMARY;
  }
}

function visitProgram(
  node: Program,
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  return visitMany(node.body, signals, context);
}

function visitLoop(
  node: LoopAstNode,
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  signals.loopCount += 1;

  if (!signals.evidence.firstLoop) {
    signals.evidence.firstLoop = { kind: "loop", node };
  }

  if (context.loopStack.length > 0 && !signals.evidence.nestedLoop) {
    signals.evidence.nestedLoop = {
      kind: "loop",
      node: context.loopStack[context.loopStack.length - 1],
      nestedNode: node,
    };
  }

  if (!signals.evidence.bottomUp) {
    signals.evidence.bottomUp =
      context.loopStack.length > 0 && signals.evidence.nestedLoop
        ? signals.evidence.nestedLoop
        : { kind: "loop", node };
  }

  if (node.type === "For") {
    visitNode(node.start, signals, context);
    visitNode(node.end, signals, context);
  } else if (node.type === "While") {
    visitNode(node.test, signals, context);
  } else {
    visitNode(node.test, signals, context);
  }

  const loopSummary = visitNode(node.body, signals, {
    ...context,
    loopDepth: context.loopDepth + 1,
    loopStack: [...context.loopStack, node],
  });

  return loopSummary;
}

function visitBlock(
  node: Block,
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  let summary = EMPTY_SUMMARY;
  let seenRecursiveCall = false;

  for (const stmt of node.body) {
    const stmtSummary = visitNode(stmt, signals, context);

    if (!seenRecursiveCall && stmtSummary.hasIndexedRead) {
      signals.hasIndexedReadBeforeRecursiveCall = true;
    }

    if (seenRecursiveCall && stmtSummary.hasIndexedWrite) {
      signals.hasIndexedWriteAfterRecursiveCall = true;
      if (
        signals.evidence.memoization?.kind === "if" &&
        !signals.evidence.memoization.secondaryNode &&
        stmt.type === "Assign"
      ) {
        signals.evidence.memoization = {
          ...signals.evidence.memoization,
          secondaryNode: stmt,
        };
      }
    }

    if (seenRecursiveCall && stmtSummary.hasUndoMutation) {
      signals.hasUndoAfterRecursiveCall = true;
    }

    seenRecursiveCall ||= stmtSummary.hasSelfCall;
    summary = mergeSummaries(summary, stmtSummary);
  }

  if (
    !signals.evidence.search &&
    summary.hasSelfCall &&
    summary.hasCandidateMutation &&
    summary.hasUndoMutation
  ) {
    signals.evidence.search = { kind: "block", node };
  }

  if (
    !signals.evidence.branchAndBound &&
    summary.hasSelfCall &&
    summary.hasCandidateMutation &&
    summary.hasUndoMutation &&
    summary.hasBoundComparison &&
    summary.hasPruningReturn
  ) {
    signals.evidence.branchAndBound = { kind: "block", node };
  }

  return summary;
}

function visitIf(
  node: If,
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  signals.hasFeasibilityCondition = true;

  const testSummary = visitNode(node.test, signals, context);
  const consequentSummary = visitNode(node.consequent, signals, context);
  const alternateSummary = node.alternate
    ? visitNode(node.alternate, signals, context)
    : EMPTY_SUMMARY;

  const branchHasReturn =
    consequentSummary.hasPruningReturn || alternateSummary.hasPruningReturn;

  if (
    !signals.evidence.memoization &&
    testSummary.hasIndexedRead &&
    branchHasReturn
  ) {
    signals.evidence.memoization = { kind: "if", node };
  }

  if (
    context.loopDepth > 0 &&
    testSummary.hasBoundComparison &&
    (consequentSummary.hasCandidateMutation ||
      alternateSummary.hasCandidateMutation ||
      consequentSummary.hasPruningReturn ||
      alternateSummary.hasPruningReturn)
  ) {
    signals.hasLocalSelection = true;

    if (!signals.evidence.greedy && context.loopStack.length > 0) {
      signals.evidence.greedy = {
        kind: "loop",
        node: context.loopStack[context.loopStack.length - 1],
      };
    }
  }

  return mergeSummaries(testSummary, consequentSummary, alternateSummary, {
    ...EMPTY_SUMMARY,
    hasBoundComparison: testSummary.hasBoundComparison,
    hasLocalSelection:
      context.loopDepth > 0 &&
      testSummary.hasBoundComparison &&
      (consequentSummary.hasCandidateMutation ||
        alternateSummary.hasCandidateMutation ||
        consequentSummary.hasPruningReturn ||
        alternateSummary.hasPruningReturn),
  });
}

function visitAssign(
  node: Assign,
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  const targetSummary = visitAssignmentTarget(node.target, signals, context);
  const valueSummary = visitNode(node.value, signals, context);

  const isIndexedWrite = node.target.type === "Index";
  const isUndoMutation = isFalseLiteral(node.value);
  const hasCandidateMutation = isMutationTarget(node.target);

  if (isIndexedWrite && context.loopDepth > 0) {
    signals.hasIterativeIndexedWrites = true;
  }

  if (
    isIndexedWrite &&
    (valueSummary.hasIndexedRead || valueSummary.hasPreviousStateDependency)
  ) {
    signals.hasPreviousStateDependency = true;
  }

  if (valueSummary.hasSelfCall && isIndexedWrite) {
    signals.hasIndexedWriteAfterRecursiveCall = true;
  }

  if (valueSummary.hasSelfCall && isUndoMutation) {
    signals.hasUndoAfterRecursiveCall = true;
  }

  if (hasCandidateMutation) {
    signals.hasCandidateMutation = true;
  }

  if (isUndoMutation) {
    signals.hasUndoAfterRecursiveCall ||= valueSummary.hasSelfCall;
  }

  if (valueSummary.hasDivision && valueSummary.hasAddition) {
    signals.hasMidpointComputation = true;
  }

  if (valueSummary.selfCallCount >= 2 && !signals.evidence.multipleRecursive) {
    signals.evidence.multipleRecursive = { kind: "assign", node };
  }

  if (valueSummary.selfCallCount === 1 && !signals.evidence.singleRecursive) {
    signals.evidence.singleRecursive = { kind: "assign", node };
  }

  return mergeSummaries(targetSummary, valueSummary, {
    ...EMPTY_SUMMARY,
    hasIndexedWrite: isIndexedWrite,
    hasCandidateMutation,
    hasUndoMutation: isUndoMutation,
    hasPreviousStateDependency:
      isIndexedWrite &&
      (valueSummary.hasIndexedRead || valueSummary.hasPreviousStateDependency),
  });
}

function visitReturn(
  node: Return,
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  signals.hasPruningReturn = true;
  const valueSummary = visitNode(node.value, signals, context);

  if (valueSummary.selfCallCount >= 2 && !signals.evidence.multipleRecursive) {
    signals.evidence.multipleRecursive = { kind: "return", node };
  }

  if (valueSummary.selfCallCount === 1 && !signals.evidence.singleRecursive) {
    signals.evidence.singleRecursive = { kind: "return", node };
  }

  return mergeSummaries(
    { ...EMPTY_SUMMARY, hasPruningReturn: true },
    valueSummary,
  );
}

function visitCall(
  node: Call,
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  const argsSummary = visitMany(node.args, signals, context);
  const isSelfCall =
    context.currentProcedureName !== null &&
    node.callee === context.currentProcedureName;

  if (isSelfCall) {
    signals.recursiveCallCount += 1;
    signals.hasSelfCall = true;
    if (argsSummary.hasDivision) signals.hasDivideArgument = true;
    if (argsSummary.hasSubtraction) signals.hasMinusArgument = true;
    if (node.args.length >= 2 && argsSummary.hasMidpointLike) {
      signals.hasRangeSplit = true;
    }

    if (!signals.evidence.singleRecursive) {
      signals.evidence.singleRecursive = { kind: "call", node };
    }

    if (
      !signals.evidence.divideAndConquer &&
      (argsSummary.hasDivision ||
        argsSummary.hasMidpointLike ||
        (node.args.length >= 2 && argsSummary.hasMidpointLike))
    ) {
      signals.evidence.divideAndConquer = { kind: "call", node };
    }
  }

  return mergeSummaries(argsSummary, {
    ...EMPTY_SUMMARY,
    hasSelfCall: isSelfCall,
    selfCallCount: isSelfCall ? 1 : 0,
  });
}

function visitBinary(
  node: Extract<AstNode, { type: "Binary" }>,
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  const leftSummary = visitNode(node.left, signals, context);
  const rightSummary = visitNode(node.right, signals, context);

  const hasDivision = node.op === "/" || node.op === "div";
  const hasSubtraction = node.op === "-";
  const hasAddition = node.op === "+";
  const hasBoundComparison =
    node.op === "<" || node.op === "<=" || node.op === ">" || node.op === ">=";

  if (hasBoundComparison) {
    signals.hasBoundComparison = true;
  }

  return mergeSummaries(leftSummary, rightSummary, {
    ...EMPTY_SUMMARY,
    hasDivision,
    hasSubtraction,
    hasAddition,
    hasBoundComparison,
    hasMidpointLike:
      hasDivision ||
      (hasAddition &&
        (leftSummary.hasDivision ||
          rightSummary.hasDivision ||
          leftSummary.hasMidpointLike ||
          rightSummary.hasMidpointLike)),
  });
}

function visitIndex(
  node: Extract<AstNode, { type: "Index" }>,
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  const targetSummary = visitNode(node.target, signals, context);
  const indexSummary = node.index
    ? visitNode(node.index, signals, context)
    : EMPTY_SUMMARY;
  const rangeStartSummary = node.range
    ? visitNode(node.range.start, signals, context)
    : EMPTY_SUMMARY;
  const rangeEndSummary = node.range
    ? visitNode(node.range.end, signals, context)
    : EMPTY_SUMMARY;

  const hasPreviousStateDependency =
    indexSummary.hasSubtraction ||
    rangeStartSummary.hasSubtraction ||
    rangeEndSummary.hasSubtraction;

  if (hasPreviousStateDependency) {
    signals.hasPreviousStateDependency = true;
  }

  return mergeSummaries(
    targetSummary,
    indexSummary,
    rangeStartSummary,
    rangeEndSummary,
    {
      ...EMPTY_SUMMARY,
      hasIndexedRead: true,
      hasPreviousStateDependency,
    },
  );
}

function visitMany(
  nodes: AstNode[],
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  let summary = EMPTY_SUMMARY;
  for (const node of nodes) {
    summary = mergeSummaries(summary, visitNode(node, signals, context));
  }
  return summary;
}

function visitAssignmentTarget(
  node: AstNode,
  signals: AstSignals,
  context: VisitContext,
): SubtreeSummary {
  switch (node.type) {
    case "Index": {
      const targetSummary = visitNode(node.target, signals, context);
      const indexSummary = node.index
        ? visitNode(node.index, signals, context)
        : EMPTY_SUMMARY;
      const rangeStartSummary = node.range
        ? visitNode(node.range.start, signals, context)
        : EMPTY_SUMMARY;
      const rangeEndSummary = node.range
        ? visitNode(node.range.end, signals, context)
        : EMPTY_SUMMARY;
      return mergeSummaries(
        targetSummary,
        indexSummary,
        rangeStartSummary,
        rangeEndSummary,
      );
    }
    case "Field":
      return visitNode(node.target, signals, context);
    default:
      return visitNode(node, signals, context);
  }
}

function mergeSummaries(...summaries: SubtreeSummary[]): SubtreeSummary {
  return summaries.reduce<SubtreeSummary>(
    (acc, current) => ({
      hasSelfCall: acc.hasSelfCall || current.hasSelfCall,
      selfCallCount: acc.selfCallCount + current.selfCallCount,
      hasIndexedRead: acc.hasIndexedRead || current.hasIndexedRead,
      hasIndexedWrite: acc.hasIndexedWrite || current.hasIndexedWrite,
      hasCandidateMutation:
        acc.hasCandidateMutation || current.hasCandidateMutation,
      hasUndoMutation: acc.hasUndoMutation || current.hasUndoMutation,
      hasPruningReturn: acc.hasPruningReturn || current.hasPruningReturn,
      hasBoundComparison: acc.hasBoundComparison || current.hasBoundComparison,
      hasLocalSelection: acc.hasLocalSelection || current.hasLocalSelection,
      hasDivision: acc.hasDivision || current.hasDivision,
      hasSubtraction: acc.hasSubtraction || current.hasSubtraction,
      hasAddition: acc.hasAddition || current.hasAddition,
      hasMidpointLike: acc.hasMidpointLike || current.hasMidpointLike,
      hasPreviousStateDependency:
        acc.hasPreviousStateDependency || current.hasPreviousStateDependency,
    }),
    EMPTY_SUMMARY,
  );
}

function isMutationTarget(node: AstNode): boolean {
  return (
    node.type === "Index" || node.type === "Field" || node.type === "Identifier"
  );
}

function isFalseLiteral(node: AstNode): boolean {
  return node.type === "Literal" && node.value === false;
}
