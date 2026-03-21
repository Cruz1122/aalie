import type { SnapshotAlgorithmType, SnapshotCase, SnapshotRecursiveMethod, SnapshotSectionStatus } from "@aa/types";

import { EN_EXPORT_I18N } from "./en";
import { ES_EXPORT_I18N } from "./es";

export interface ExportI18nBundle {
  locale: "es" | "en";
  documentTitle: string;
  institutionLineA: string;
  institutionLineB: string;
  institutionLineC: string;
  versionLabel: string;
  dateLabel: string;
  executiveSummaryTitle: string;
  pseudocodeTitle: string;
  parsingTitle: string;
  globalResultTitle: string;
  iterativeTitle: string;
  recursiveTitle: string;
  comparativeTitle: string;
  conclusionsTitle: string;
  traceTitle: string;
  metadataTitle: string;
  statusPrefix: string;
  notAvailable: string;
  generatedFromSnapshot: string;
  warningBanner: string;
  todoPrefix: string;
  pedagogicalCostLabel: string;
  pedagogicalFinalComplexityLabel: string;
  pedagogicalCaseTitle: string;
  pedagogicalMethodDetails: string;
  pedagogicalLineCostTitle: string;
  pedagogicalSimplificationTitle: string;
  pedagogicalAsymptoticTitle: string;
  pedagogicalTraceTitle: string;
  pedagogicalNoData: string;
  parseSummaryOk: string;
  parseSummaryIssues: string;
  methodsAppliedLabel: string;
  methodsAvailableLabel: string;
  selectedMethodLabel: string;
  recurrenceLabel: string;
  caseHeaderLabel: string;
  caseLabels: Record<SnapshotCase, string>;
  methodLabels: Record<SnapshotRecursiveMethod, string>;
  algorithmTypeLabels: Record<SnapshotAlgorithmType, string>;
  sectionStatusLabels: Record<SnapshotSectionStatus, string>;
  statusLabels: {
    normalizedPseudocode: string;
    traceSummary: string;
    iterativeTrace: string;
    loopInvariant: string;
    recurrence: string;
    selectedMethod: string;
    methodsAvailable: string;
    methodDetails: string;
    roots: string;
    closedForm: string;
    recursionTreeSerializable: string;
    callTrace: string;
    llm: string;
    gpuCpu: string;
  };
  todos: {
    normalizedPseudocode: string;
    loopInvariant: string;
    symbolicRecurrenceTree: string;
  };
  headers: {
    caseResults: string[];
    lineCosts: string[];
    traceSummary: string[];
    recurrenceTreeLevels: string[];
    roots: string[];
    keyValue: string[];
  };
  formulas: {
    recurrenceTreeHeight: string;
    recurrenceTreeSummation: string;
    recurrenceTreeTheta: string;
    characteristicEquation: string;
    homogeneousSolution: string;
    particularSolution: string;
    generalSolution: string;
    closedForm: string;
  };
}

const BUNDLES: Record<"es" | "en", ExportI18nBundle> = {
  es: ES_EXPORT_I18N,
  en: EN_EXPORT_I18N,
};

export function getExportI18n(locale: string | undefined | null): ExportI18nBundle {
  const normalized = String(locale || "en").toLowerCase().startsWith("es") ? "es" : "en";
  return BUNDLES[normalized];
}

export { EN_EXPORT_I18N, ES_EXPORT_I18N };
