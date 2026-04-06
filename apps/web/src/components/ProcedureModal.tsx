"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import AAAnalysisStepsModal from "./AAAnalysisStepsModal";

interface ProcedureModalProps {
  open: boolean;
  onClose: () => void;
  selectedLine?: number | null;
  analysisData?: AnalyzeOpenResponse;
}

export default function ProcedureModal({
  open,
  onClose,
  selectedLine,
  analysisData,
}: Readonly<ProcedureModalProps>) {
  const t = useTranslations("analyzer.procedureModal");
  const isAvgCase = Boolean(analysisData?.totals?.avg_model_info);

  const lineData = useMemo(() => {
    if (selectedLine == null || !analysisData?.byLine) return null;
    return (
      analysisData.byLine.find((line) => line.line === selectedLine) || null
    );
  }, [analysisData?.byLine, selectedLine]);

  const modalTitle = useMemo(() => {
    const caseSuffix = isAvgCase ? t("avgCaseSuffix") : "";
    if (selectedLine == null) {
      return `${t("titleComplete")}${caseSuffix}`;
    }
    return `${t("titleLine", { line: selectedLine })}${caseSuffix}`;
  }, [isAvgCase, selectedLine, t]);

  return (
    <AAAnalysisStepsModal
      open={open}
      onClose={onClose}
      bundle={lineData?.step_by_step}
      title={modalTitle}
      showOverview={false}
      accentOverride="purple"
    />
  );
}
