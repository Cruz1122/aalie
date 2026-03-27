"use client";

import type { AnalyzeOpenResponse } from "@aa/types";

import AAAnalysisStepsModal from "./AAAnalysisStepsModal";

interface RecursionTreeProcedureModalProps {
  open: boolean;
  onClose: () => void;
  recurrence: AnalyzeOpenResponse["totals"]["recurrence"] | null | undefined;
  recursionTree:
    | AnalyzeOpenResponse["totals"]["recursion_tree"]
    | null
    | undefined;
  theta: string | null | undefined;
}

export default function RecursionTreeProcedureModal({
  open,
  onClose,
  recurrence,
  recursionTree,
  theta,
}: Readonly<RecursionTreeProcedureModalProps>) {
  return (
    <AAAnalysisStepsModal
      open={open}
      onClose={onClose}
      bundle={recursionTree?.step_by_step}
      equation={recurrence?.form || null}
      theta={theta || recursionTree?.theta || null}
      equationLabelKey="recurrenceEquation"
    />
  );
}
