import type { AnalyzeOpenResponse } from "@aa/types";

import type { CoreAnalysisData } from "./extract-core-data";

type ComparableCase = AnalyzeOpenResponse | "same_as_worst" | null | undefined;

type ComparisonDataState = {
  worst: AnalyzeOpenResponse | null;
  best: AnalyzeOpenResponse | "same_as_worst" | null;
  avg?: AnalyzeOpenResponse | "same_as_worst" | null;
  has_case_variability?: boolean;
} | null;

function buildRecursiveCasePayload(
  caseData: AnalyzeOpenResponse | null,
  coreData: CoreAnalysisData | null,
) {
  if (!caseData || !caseData.ok) return coreData;

  return {
    ...coreData,
    recurrence: coreData?.recurrence,
    method: coreData?.method || caseData.totals.recurrence?.method,
    characteristic_equation: coreData?.characteristic_equation
      ? {
          ...coreData.characteristic_equation,
          step_by_step: caseData.totals.characteristic_equation?.step_by_step,
        }
      : undefined,
    iteration: coreData?.iteration
      ? {
          ...coreData.iteration,
          step_by_step: caseData.totals.iteration?.step_by_step,
        }
      : undefined,
    master: coreData?.master
      ? {
          ...coreData.master,
          step_by_step: caseData.totals.master?.step_by_step,
        }
      : undefined,
    recursion_tree: coreData?.recursion_tree
      ? {
          ...coreData.recursion_tree,
          step_by_step: caseData.totals.recursion_tree?.step_by_step,
        }
      : undefined,
  };
}

function buildIterativeCasePayload(
  caseData: AnalyzeOpenResponse | null,
  coreData: CoreAnalysisData | null,
) {
  if (!caseData || !caseData.ok) return coreData;

  return {
    ...coreData,
    step_by_step: caseData.totals.step_by_step,
  };
}

function resolveCase(
  value: ComparableCase,
  worst: AnalyzeOpenResponse | null,
): AnalyzeOpenResponse | null {
  if (value === "same_as_worst") return worst;
  return value ?? null;
}

function buildCasePayload(
  caseData: ComparableCase,
  coreData: CoreAnalysisData | null,
  worst: AnalyzeOpenResponse | null,
  isRecursive: boolean,
) {
  const resolved = resolveCase(caseData, worst);
  return isRecursive
    ? buildRecursiveCasePayload(resolved, coreData)
    : buildIterativeCasePayload(resolved, coreData);
}

export function buildLlmComparisonPayload(args: {
  data: ComparisonDataState;
  isRecursive: boolean;
  worst: CoreAnalysisData | null;
  best: CoreAnalysisData | null;
  avg: CoreAnalysisData | null;
}) {
  const { data, isRecursive, worst, best, avg } = args;
  if (!data) return null;

  return {
    worst: buildCasePayload(data.worst, worst, data.worst, isRecursive),
    best: buildCasePayload(data.best, best, data.worst, isRecursive),
    avg: buildCasePayload(data.avg, avg, data.worst, isRecursive),
    isRecursive,
    has_case_variability: data.has_case_variability || false,
    walkthrough_contract: isRecursive
      ? {
          iterative: null,
          recursive: {
            requirement:
              "Cada método recursivo reportado debe incluir su bundle step_by_step del sistema.",
            methods: [
              "characteristic_equation",
              "iteration",
              "master",
              "recursion_tree",
            ],
          },
        }
      : {
          iterative: {
            requirement:
              "Cada caso iterativo reportado debe incluir step_by_step con method=iterative_case.",
            method: "iterative_case",
          },
          recursive: null,
        },
  };
}
