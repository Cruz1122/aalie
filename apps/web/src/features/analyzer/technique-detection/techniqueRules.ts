import type {
  AstEvidenceNode,
  AstSignals,
  TechniqueDetectionResult,
} from "./techniqueTypes";

export type RuleMatch = {
  matched: boolean;
  evidenceNode: AstEvidenceNode | null;
};

type TechniqueTranslator = (key: string) => string;

type Rule = {
  technique: TechniqueDetectionResult["technique"];
  priority: number;
  match: (signals: AstSignals) => RuleMatch;
  confidence: TechniqueDetectionResult["confidence"];
  explanation: string;
};

export function getTechniqueRules(t: TechniqueTranslator): Rule[] {
  return [
    {
      technique: "branch_and_bound",
      priority: 100,
      match: (s) => ({
        matched:
          s.hasSelfCall &&
          s.hasCandidateMutation &&
          s.hasUndoAfterRecursiveCall &&
          s.hasBoundComparison &&
          s.hasPruningReturn,
        evidenceNode: s.evidence.branchAndBound,
      }),
      confidence: "high",
      explanation: t("explanations.branch_and_bound"),
    },
    {
      technique: "dp_top_down",
      priority: 90,
      match: (s) => ({
        matched:
          s.hasSelfCall &&
          s.hasIndexedReadBeforeRecursiveCall &&
          s.hasIndexedWriteAfterRecursiveCall,
        evidenceNode: s.evidence.memoization,
      }),
      confidence: "high",
      explanation: t("explanations.dp_top_down"),
    },
    {
      technique: "dp_bottom_up",
      priority: 80,
      match: (s) => ({
        matched:
          !s.hasSelfCall &&
          s.loopCount > 0 &&
          s.hasIterativeIndexedWrites &&
          s.hasPreviousStateDependency,
        evidenceNode:
          s.evidence.bottomUp ?? s.evidence.nestedLoop ?? s.evidence.firstLoop,
      }),
      confidence: "medium",
      explanation: t("explanations.dp_bottom_up"),
    },
    {
      technique: "backtracking",
      priority: 70,
      match: (s) => ({
        matched:
          s.hasSelfCall &&
          s.hasCandidateMutation &&
          s.hasUndoAfterRecursiveCall,
        evidenceNode: s.evidence.search,
      }),
      confidence: "high",
      explanation: t("explanations.backtracking"),
    },
    {
      technique: "divide_and_conquer",
      priority: 60,
      match: (s) => ({
        matched:
          s.hasMultipleSelfCalls &&
          (s.hasDivideArgument || s.hasRangeSplit || s.hasMidpointComputation),
        evidenceNode:
          s.evidence.divideAndConquer ?? s.evidence.multipleRecursive,
      }),
      confidence: "high",
      explanation: t("explanations.divide_and_conquer"),
    },
    {
      technique: "decrease_and_be_conquered",
      priority: 50,
      match: (s) => ({
        matched:
          s.hasMultipleSelfCalls &&
          s.hasMinusArgument &&
          !s.hasIndexedReadBeforeRecursiveCall,
        evidenceNode: s.evidence.multipleRecursive,
      }),
      confidence: "high",
      explanation: t("explanations.decrease_and_be_conquered"),
    },
    {
      technique: "decrease_and_conquer",
      priority: 40,
      match: (s) => ({
        matched: s.hasSingleSelfCall && s.hasMinusArgument,
        evidenceNode: s.evidence.singleRecursive,
      }),
      confidence: "high",
      explanation: t("explanations.decrease_and_conquer"),
    },
    {
      technique: "greedy",
      priority: 30,
      match: (s) => ({
        matched:
          !s.hasSelfCall &&
          s.loopCount > 0 &&
          s.hasLocalSelection &&
          s.hasCommittedSelection &&
          !s.hasPreviousStateDependency,
        evidenceNode: s.evidence.greedy ?? s.evidence.firstLoop,
      }),
      confidence: "low",
      explanation: t("explanations.greedy"),
    },
    {
      technique: "iterative",
      priority: 10,
      match: (s) => ({
        matched: !s.hasSelfCall && s.loopCount > 0,
        evidenceNode: s.evidence.nestedLoop ?? s.evidence.firstLoop,
      }),
      confidence: "medium",
      explanation: t("explanations.iterative"),
    },
    {
      technique: "unknown",
      priority: 0,
      match: () => ({
        matched: true,
        evidenceNode: null,
      }),
      confidence: "low",
      explanation: t("explanations.unknown"),
    },
  ];
}

export function signalLabels(signals: AstSignals): string[] {
  const labels: string[] = [];

  if (signals.loopCount > 0) labels.push("usa ciclos");
  if (signals.hasSelfCall) labels.push("usa recursión");
  if (signals.hasMultipleSelfCalls)
    labels.push("tiene varias llamadas recursivas");
  if (signals.hasSingleSelfCall)
    labels.push("tiene una llamada recursiva dominante");
  if (signals.hasDivideArgument) labels.push("reduce por división");
  if (signals.hasMinusArgument) labels.push("reduce por resta");
  if (signals.hasRangeSplit) labels.push("parte rangos");
  if (signals.hasMidpointComputation) labels.push("calcula punto medio");
  if (signals.hasIndexedReadBeforeRecursiveCall)
    labels.push("consulta tabla antes de calcular");
  if (signals.hasIndexedWriteAfterRecursiveCall)
    labels.push("guarda resultados calculados");
  if (signals.hasIterativeIndexedWrites) labels.push("llena tabla con ciclos");
  if (signals.hasPreviousStateDependency) labels.push("usa estados previos");
  if (signals.hasCandidateMutation) labels.push("construye solución parcial");
  if (signals.hasUndoAfterRecursiveCall) labels.push("deshace decisiones");
  if (signals.hasPruningReturn) labels.push("poda ramas");
  if (signals.hasBoundComparison) labels.push("compara cotas");
  if (signals.hasLocalSelection) labels.push("hace selección local");

  return labels;
}
