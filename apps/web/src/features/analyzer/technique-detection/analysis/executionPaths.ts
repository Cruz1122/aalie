export type ExecSummary = {
  totalSelfCallSites: number;
  maxSelfCallsOnAnyPath: number;
  hasCoExecutedSelfCalls: boolean;
  hasMutuallyExclusiveSelfCalls: boolean;
  hasSelfCallsInSameExpression: boolean;
  hasSelfCallInsideLoop: boolean;
  representativeCallIds: string[];
};

export function emptyExecSummary(): ExecSummary {
  return {
    totalSelfCallSites: 0,
    maxSelfCallsOnAnyPath: 0,
    hasCoExecutedSelfCalls: false,
    hasMutuallyExclusiveSelfCalls: false,
    hasSelfCallsInSameExpression: false,
    hasSelfCallInsideLoop: false,
    representativeCallIds: [],
  };
}

export function sequenceExecSummary(
  a: ExecSummary,
  b: ExecSummary,
): ExecSummary {
  const total = a.totalSelfCallSites + b.totalSelfCallSites;
  const maxPath = a.maxSelfCallsOnAnyPath + b.maxSelfCallsOnAnyPath;

  return {
    totalSelfCallSites: total,
    maxSelfCallsOnAnyPath: maxPath,
    hasCoExecutedSelfCalls:
      a.hasCoExecutedSelfCalls ||
      b.hasCoExecutedSelfCalls ||
      (a.maxSelfCallsOnAnyPath > 0 && b.maxSelfCallsOnAnyPath > 0) ||
      maxPath >= 2,
    hasMutuallyExclusiveSelfCalls:
      a.hasMutuallyExclusiveSelfCalls || b.hasMutuallyExclusiveSelfCalls,
    hasSelfCallsInSameExpression:
      a.hasSelfCallsInSameExpression || b.hasSelfCallsInSameExpression,
    hasSelfCallInsideLoop: a.hasSelfCallInsideLoop || b.hasSelfCallInsideLoop,
    representativeCallIds: [
      ...a.representativeCallIds,
      ...b.representativeCallIds,
    ].slice(0, 8),
  };
}

export function alternativeExecSummary(branches: ExecSummary[]): ExecSummary {
  const total = branches.reduce(
    (acc, branch) => acc + branch.totalSelfCallSites,
    0,
  );
  const maxPath = Math.max(
    0,
    ...branches.map((branch) => branch.maxSelfCallsOnAnyPath),
  );
  const branchesWithCalls = branches.filter(
    (branch) => branch.maxSelfCallsOnAnyPath > 0,
  ).length;

  return {
    totalSelfCallSites: total,
    maxSelfCallsOnAnyPath: maxPath,
    hasCoExecutedSelfCalls: branches.some(
      (branch) => branch.hasCoExecutedSelfCalls,
    ),
    hasMutuallyExclusiveSelfCalls:
      branchesWithCalls >= 2 ||
      branches.some((branch) => branch.hasMutuallyExclusiveSelfCalls),
    hasSelfCallsInSameExpression: branches.some(
      (branch) => branch.hasSelfCallsInSameExpression,
    ),
    hasSelfCallInsideLoop: branches.some(
      (branch) => branch.hasSelfCallInsideLoop,
    ),
    representativeCallIds: branches
      .flatMap((branch) => branch.representativeCallIds)
      .slice(0, 8),
  };
}
