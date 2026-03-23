import type { AalieAnalysisSnapshotV1, SnapshotSection } from "@aa/types";

export interface SnapshotValidationResult {
  valid: boolean;
  errors: string[];
}

function validateSection(path: string, section: SnapshotSection<unknown> | undefined, errors: string[]): void {
  if (!section) {
    errors.push(`${path} is required`);
    return;
  }
  if (!section.status) {
    errors.push(`${path}.status is required`);
  }
}

export function validateSnapshot(snapshot: AalieAnalysisSnapshotV1): SnapshotValidationResult {
  const errors: string[] = [];

  if (!snapshot.schemaVersion) errors.push("schemaVersion is required");
  if (snapshot.schemaVersion) {
    const major = String(snapshot.schemaVersion).split(".")[0];
    if (major !== "1") {
      errors.push(
        `Unsupported schemaVersion '${snapshot.schemaVersion}'. Supported major version: 1.`,
      );
    }
  }
  if (!snapshot.snapshotId) errors.push("snapshotId is required");
  if (!snapshot.contentHash) errors.push("contentHash is required");
  if (!snapshot.createdAt) errors.push("createdAt is required");
  if (!snapshot.locale) errors.push("locale is required");

  if (!snapshot.meta?.analysisId) errors.push("meta.analysisId is required");
  if (!snapshot.meta?.algorithm?.name) errors.push("meta.algorithm.name is required");

  if (!snapshot.input?.originalPseudocode) {
    errors.push("input.originalPseudocode is required");
  }

  validateSection("input.normalizedPseudocode", snapshot.input?.normalizedPseudocode, errors);
  validateSection("input.traceSummary", snapshot.input?.traceSummary, errors);
  validateSection("internal.ast", snapshot.internal?.ast, errors);
  validateSection("internal.classification", snapshot.internal?.classification, errors);
  validateSection("internal.recurrence", snapshot.internal?.recurrence, errors);
  validateSection("internal.intermediateMath", snapshot.internal?.intermediateMath, errors);

  validateSection("iterative", snapshot.iterative, errors);
  validateSection("recursive", snapshot.recursive, errors);
  validateSection("comparative.llm", snapshot.comparative?.llm, errors);
  validateSection("comparative.gpuCpu", snapshot.comparative?.gpuCpu, errors);

  if (!snapshot.globalResult?.cases) {
    errors.push("globalResult.cases is required");
  } else {
    for (const requiredCase of ["worst", "best", "avg"] as const) {
      if (!(requiredCase in snapshot.globalResult.cases)) {
        errors.push(`globalResult.cases.${requiredCase} is required`);
      }
    }
  }

  if (!snapshot.institutional?.disclaimer) {
    errors.push("institutional.disclaimer is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidSnapshot(snapshot: AalieAnalysisSnapshotV1): void {
  const validation = validateSnapshot(snapshot);
  if (!validation.valid) {
    throw new Error(`Invalid AALIE snapshot: ${validation.errors.join("; ")}`);
  }
}
