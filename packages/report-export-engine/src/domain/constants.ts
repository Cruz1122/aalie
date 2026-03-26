import type { SnapshotSectionStatus } from "@aa/types";

export const EXPORT_SUPPORTED_LOCALES = ["es", "en"] as const;
export type ExportSupportedLocale = (typeof EXPORT_SUPPORTED_LOCALES)[number];

export const DEFAULT_SOURCE_ORIGIN = "editor" as const;
export const DEFAULT_TRACE_CASE = "worst" as const;

export const SECTION_STATUS: Record<SnapshotSectionStatus, SnapshotSectionStatus> = {
  available: "available",
  not_requested: "not_requested",
  not_supported: "not_supported",
  not_implemented: "not_implemented",
  missing_data: "missing_data",
};

export const INSTITUTIONAL_DISCLAIMER_TEXT = {
  es: "Este documento fue generado automáticamente como apoyo al análisis y puede contener omisiones o imprecisiones. No sustituye criterio profesional ni garantiza exactitud total. Valide los resultados y consulte a un especialista cuando aplique.",
  en: "This document was generated automatically as analytical support and may contain omissions or inaccuracies. It does not replace professional judgment or guarantee complete accuracy. Validate the results and consult a specialist when applicable.",
} as const;

export const DEFAULT_GENERAL_LIMITATIONS_ES = [
  "El análisis automático puede fallar o ser no concluyente en algoritmos complejos o no canónicos.",
  "La clasificación de recurrencias y simplificaciones simbólicas depende de patrones detectables en el AST.",
  "La comparación con LLM es auxiliar y su contrato puede variar según el proveedor/modelo.",
];

export const DEFAULT_GENERAL_LIMITATIONS_EN = [
  "Automatic analysis can fail or be inconclusive for complex or non-canonical algorithms.",
  "Recurrence classification and symbolic simplification depend on patterns detectable in the AST.",
  "LLM comparison is auxiliary and its contract can vary by provider/model.",
];

export const SNAPSHOT_NOT_IMPLEMENTED_TODOS = {
  normalizedPseudocode: "Normalized pseudocode serialization is not implemented.",
  loopInvariant: "Loop invariant extraction is not implemented.",
  symbolicRecurrenceTree: "Full symbolic recurrence tree reconstruction is not implemented.",
};

export const MARKDOWN_FILENAME = "report.md";
export const LATEX_FILENAME = "report.tex";
export const PDF_FILENAME = "report.pdf";

export const EXPORT_BUNDLE_FILES = {
  markdown: MARKDOWN_FILENAME,
  latex: LATEX_FILENAME,
  pdf: PDF_FILENAME,
} as const;
