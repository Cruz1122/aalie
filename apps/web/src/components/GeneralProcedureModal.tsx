"use client";

import type { AnalyzeOpenResponse } from "@aa/types";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import AAAnalysisStepsModal from "./AAAnalysisStepsModal";

interface GeneralProcedureModalProps {
  open: boolean;
  onClose: () => void;
  data: AnalyzeOpenResponse | undefined;
  caseType?: "worst" | "best" | "average";
}

export default function GeneralProcedureModal({
  open,
  onClose,
  data,
  caseType = "worst",
}: Readonly<GeneralProcedureModalProps>) {
  const t = useTranslations("analyzer.generalProcedureModal");
  const tCases = useTranslations("analyzer.cases");

  const caseLabel = useMemo(() => {
    if (caseType === "best") return tCases("best");
    if (caseType === "average") return tCases("average");
    return tCases("worst");
  }, [caseType, tCases]);

  const modalTitle = useMemo(
    () => `${t("title")} - ${caseLabel}`,
    [caseLabel, t],
  );

  return (
    <AAAnalysisStepsModal
      open={open}
      onClose={onClose}
      bundle={data?.totals?.step_by_step}
      title={modalTitle}
      showOverview={false}
      accentOverride="purple"
    />
  );
}
