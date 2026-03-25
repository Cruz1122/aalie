"use client";

import type { AnalyzeOpenResponse } from "@aa/types";

import AAAnalysisStepsModal from "./AAAnalysisStepsModal";

interface CharacteristicEquationModalProps {
  open: boolean;
  onClose: () => void;
  characteristicEquation: AnalyzeOpenResponse["totals"]["characteristic_equation"] | null | undefined;
  theta: string | null | undefined;
}

export default function CharacteristicEquationModal({
  open,
  onClose,
  characteristicEquation,
  theta,
}: Readonly<CharacteristicEquationModalProps>) {
  return (
    <AAAnalysisStepsModal
      open={open}
      onClose={onClose}
      bundle={characteristicEquation?.step_by_step}
      equation={characteristicEquation?.equation}
      theta={theta || characteristicEquation?.theta || null}
      equationLabelKey="characteristicEquation"
    />
  );
}
