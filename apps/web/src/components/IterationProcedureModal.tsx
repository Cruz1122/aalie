"use client";

import type { AnalyzeOpenResponse } from "@aa/types";

import AAAnalysisStepsModal from "./AAAnalysisStepsModal";

interface IterationProcedureModalProps {
  open: boolean;
  onClose: () => void;
  recurrence: AnalyzeOpenResponse["totals"]["recurrence"] | null | undefined;
  iteration: AnalyzeOpenResponse["totals"]["iteration"] | null | undefined;
  theta: string | null | undefined;
}

export default function IterationProcedureModal({
  open,
  onClose,
  recurrence,
  iteration,
  theta,
}: Readonly<IterationProcedureModalProps>) {
  return (
    <AAAnalysisStepsModal
      open={open}
      onClose={onClose}
      bundle={iteration?.step_by_step}
      equation={recurrence?.form || null}
      theta={theta || iteration?.theta || null}
      equationLabelKey="recurrenceEquation"
    />
  );
}
