import {
  alternativeExecSummary,
  emptyExecSummary,
  sequenceExecSummary,
  type ExecSummary,
} from "./executionPaths";
import {
  getCallArgs,
  getCallName,
  getChildren,
  getProcedureName,
  getReturnExpr,
  kindOf,
  type AstNode,
} from "../ast/astAdapter";
import type { NodeIndex } from "../ast/nodeIdentity";

export type RecursiveCallSite = {
  id: string;
  nodeId: string;
  procedureName: string;
  args: AstNode[];
  inReturnExpression: boolean;
  assignedTo?: string;
};

export type RecursionFacts = {
  procedureName: string | null;
  calls: RecursiveCallSite[];
  summary: ExecSummary;
  hasSelfCall: boolean;
};

export function collectRecursionFacts(
  ast: AstNode,
  index: NodeIndex,
): RecursionFacts {
  const procedure = findMainProcedure(ast);
  const procedureName = procedure ? getProcedureName(procedure) : null;
  const calls: RecursiveCallSite[] = [];

  if (!procedure || !procedureName) {
    return {
      procedureName: null,
      calls,
      summary: emptyExecSummary(),
      hasSelfCall: false,
    };
  }

  let callCounter = 0;

  const analyzeSequence = (
    nodes: AstNode[],
    insideLoop: boolean,
  ): ExecSummary =>
    nodes.reduce<ExecSummary>(
      (acc, child) => sequenceExecSummary(acc, analyzeNode(child, insideLoop)),
      emptyExecSummary(),
    );

  const analyzeNode = (node: AstNode, insideLoop = false): ExecSummary => {
    const kind = kindOf(node);

    if (kind === "call") {
      const callName = getCallName(node);
      if (callName !== procedureName) return emptyExecSummary();

      const id = `rc${++callCounter}`;
      calls.push({
        id,
        nodeId: index.idOf(node),
        procedureName,
        args: getCallArgs(node),
        inReturnExpression: false,
      });

      return {
        totalSelfCallSites: 1,
        maxSelfCallsOnAnyPath: 1,
        hasCoExecutedSelfCalls: false,
        hasMutuallyExclusiveSelfCalls: false,
        hasSelfCallsInSameExpression: false,
        hasSelfCallInsideLoop: insideLoop,
        representativeCallIds: [id],
      };
    }

    if (kind === "return") {
      const expr = getReturnExpr(node);
      const callsInExpr = collectSelfCallsInExpr(expr, procedureName);
      const count = callsInExpr.length;

      if (count === 0) return emptyExecSummary();

      const ids: string[] = [];
      for (const callNode of callsInExpr) {
        const id = `rc${++callCounter}`;
        ids.push(id);
        calls.push({
          id,
          nodeId: index.idOf(callNode),
          procedureName,
          args: getCallArgs(callNode),
          inReturnExpression: true,
        });
      }

      return {
        totalSelfCallSites: count,
        maxSelfCallsOnAnyPath: count,
        hasCoExecutedSelfCalls: count >= 2,
        hasMutuallyExclusiveSelfCalls: false,
        hasSelfCallsInSameExpression: count >= 2,
        hasSelfCallInsideLoop: insideLoop,
        representativeCallIds: ids,
      };
    }

    if (kind === "if") {
      const thenNodes = normalizeBlock(
        node.thenBranch ?? node.consequent ?? node.thenBody,
      );
      const elseNodes = normalizeBlock(
        node.elseBranch ?? node.alternate ?? node.elseBody,
      );

      const thenSummary = analyzeSequence(thenNodes, insideLoop);
      const elseSummary =
        elseNodes.length > 0
          ? analyzeSequence(elseNodes, insideLoop)
          : emptyExecSummary();

      return alternativeExecSummary([thenSummary, elseSummary]);
    }

    if (kind === "for" || kind === "while" || kind === "repeat") {
      const body = normalizeBlock(
        node.body ?? node.statements ?? node.children,
      );
      const bodySummary = analyzeSequence(body, true);

      return {
        ...bodySummary,
        hasSelfCallInsideLoop:
          bodySummary.hasSelfCallInsideLoop ||
          bodySummary.maxSelfCallsOnAnyPath > 0,
      };
    }

    return analyzeSequence(getChildren(node), insideLoop);
  };

  const summary = analyzeNode(procedure);

  return {
    procedureName,
    calls,
    summary,
    hasSelfCall: calls.length > 0,
  };
}

function normalizeBlock(value: unknown): AstNode[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean) as AstNode[];
  if (typeof value === "object") {
    const node = value as AstNode;
    if (node.statements) return node.statements;
    if (Array.isArray(node.body)) return node.body;
    if (node.body) return [node.body];
    return [node];
  }
  return [];
}

export function findMainProcedure(ast: AstNode): AstNode | null {
  if (kindOf(ast) === "procedure") return ast;

  // BFS — returns the first ProcDef encountered (top-to-bottom order)
  const queue = [ast];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (kindOf(node) === "procedure") return node;
    queue.push(...getChildren(node));
  }

  return null;
}

function collectSelfCallsInExpr(
  expr: AstNode | null,
  procedureName: string,
): AstNode[] {
  if (!expr) return [];

  const out: AstNode[] = [];
  const stack = [expr];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (kindOf(node) === "call" && getCallName(node) === procedureName) {
      out.push(node);
    }
    stack.push(...getChildren(node));
  }

  return out;
}
