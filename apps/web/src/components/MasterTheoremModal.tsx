"use client";

import type { AnalyzeOpenResponse } from "@aa/types";

import AAAnalysisStepsModal from "./AAAnalysisStepsModal";

interface MasterTheoremModalProps {
  open: boolean;
  onClose: () => void;
  recurrence: AnalyzeOpenResponse["totals"]["recurrence"] | null | undefined;
  master: AnalyzeOpenResponse["totals"]["master"] | null | undefined;
  theta: string | null | undefined;
}

export default function MasterTheoremModal({
  open,
  onClose,
  recurrence,
  master,
  theta,
}: Readonly<MasterTheoremModalProps>) {
  return (
    <AAAnalysisStepsModal
      open={open}
      onClose={onClose}
      bundle={master?.step_by_step}
      equation={recurrence?.form || null}
      theta={theta || master?.theta || null}
      equationLabelKey="recurrenceEquation"
    />
  );
}
