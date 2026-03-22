import type {
  BuildExportReportResult,
  ExportFormat,
} from "@aa/exporter";
import {
  assertValidSnapshot,
  buildExportReport,
  buildSnapshot,
} from "@aa/exporter";
import type {
  AalieAnalysisSnapshotV1,
  SnapshotCase,
  SnapshotRecursiveMethod,
  SnapshotSourceOrigin,
} from "@aa/types";

import {
  collectArtifactsForSnapshot,
  type CollectArtifactsInput,
} from "./collect-artifacts";

const DEFAULT_FORMATS: ExportFormat[] = ["markdown", "latex"];
const DEFAULT_TRACE_CASES: SnapshotCase[] = ["worst"];

export interface ExportSnapshotRequest {
  source: string;
  locale?: string;
  sourceOrigin?: SnapshotSourceOrigin;
  analysisId?: string;
  includeTraceCases?: SnapshotCase[];
  includeLlm?: boolean;
  llmPayload?: unknown;
  includeGpuCpu?: boolean;
  preferredMethod?: SnapshotRecursiveMethod;
  algorithmKind?: "iterative" | "recursive" | "hybrid" | "dummy" | "unknown";
  apiKey?: string;
  requestOrigin?: string;
}

export interface ExportReportRequest extends ExportSnapshotRequest {
  formats?: ExportFormat[];
  includeSnapshotJson?: boolean;
  includeZipBundle?: boolean;
  pdfTimeoutMs?: number;
}

function normalizeLocale(locale: string | undefined): "es" | "en" {
  return String(locale || "en").toLowerCase().startsWith("es") ? "es" : "en";
}

function normalizeTraceCases(cases: unknown): SnapshotCase[] {
  if (!Array.isArray(cases) || cases.length === 0) {
    return DEFAULT_TRACE_CASES;
  }
  const normalized = cases.filter(
    (item): item is SnapshotCase => item === "worst" || item === "best" || item === "avg",
  );
  return normalized.length > 0 ? Array.from(new Set(normalized)) : DEFAULT_TRACE_CASES;
}

function normalizeFormats(formats: unknown): ExportFormat[] {
  if (!Array.isArray(formats) || formats.length === 0) {
    return DEFAULT_FORMATS;
  }
  const normalized = formats.filter(
    (item): item is ExportFormat =>
      item === "markdown" || item === "latex" || item === "pdf",
  );
  return normalized.length > 0 ? Array.from(new Set(normalized)) : DEFAULT_FORMATS;
}

function toCollectInput(input: ExportSnapshotRequest): CollectArtifactsInput {
  return {
    source: input.source,
    locale: normalizeLocale(input.locale),
    sourceOrigin: input.sourceOrigin,
    analysisId: input.analysisId,
    includeTraceCases: normalizeTraceCases(input.includeTraceCases),
    includeLlm: input.includeLlm,
    llmPayload: input.llmPayload,
    includeGpuCpu: input.includeGpuCpu,
    preferredMethod: input.preferredMethod,
    algorithmKindHint: input.algorithmKind,
    apiKey: input.apiKey,
    requestOrigin: input.requestOrigin,
  };
}

export async function createSnapshotFromSource(
  input: ExportSnapshotRequest,
): Promise<AalieAnalysisSnapshotV1> {
  if (!input.source || !input.source.trim()) {
    throw new Error("Field 'source' is required to create export snapshot.");
  }

  const artifacts = await collectArtifactsForSnapshot(toCollectInput(input));
  const snapshot = buildSnapshot(artifacts);
  assertValidSnapshot(snapshot);
  return snapshot;
}

export async function createReportFromSource(
  input: ExportReportRequest,
): Promise<BuildExportReportResult> {
  const snapshot = await createSnapshotFromSource(input);

  return buildExportReport({
    snapshot,
    formats: normalizeFormats(input.formats),
    includeSnapshotJson: input.includeSnapshotJson ?? true,
    includeZipBundle: input.includeZipBundle ?? true,
    pdf: input.pdfTimeoutMs ? { timeoutMs: input.pdfTimeoutMs } : undefined,
  });
}
