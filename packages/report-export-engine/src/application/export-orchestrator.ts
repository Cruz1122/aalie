import type { AalieAnalysisSnapshotV1 } from "@aa/types";

import {
  LATEX_FILENAME,
  MARKDOWN_FILENAME,
  PDF_FILENAME,
} from "../domain/constants";
import { assertValidSnapshot } from "../domain/snapshot-validator";
import { buildDocumentModel, type DocumentModel } from "../renderers/document-model-builder";
import { renderLatexReport } from "../renderers/latex";
import { renderMarkdownReport } from "../renderers/markdown";
import {
  compileLatexToPdf,
  LatexCompilationError,
  type CompileLatexToPdfOptions,
} from "../infrastructure/pdf/latex-compiler";
import { createZipBundle } from "../infrastructure/bundle/zip-bundle";
import { buildTraceDiagramAssets } from "./trace-diagram-assets";

export type ExportFormat = "markdown" | "latex" | "pdf";

export interface ExportArtifact {
  format: ExportFormat | "snapshot" | "asset";
  filename: string;
  mimeType: string;
  content: string | Buffer;
}

export interface BuildExportReportOptions {
  snapshot: AalieAnalysisSnapshotV1;
  formats: ExportFormat[];
  includeSnapshotJson?: boolean;
  includeZipBundle?: boolean;
  documentModel?: DocumentModel;
  pdf?: Omit<CompileLatexToPdfOptions, "texContent">;
}

export interface BuildExportReportResult {
  snapshot: AalieAnalysisSnapshotV1;
  documentModel: DocumentModel;
  artifacts: ExportArtifact[];
  bundle?: {
    filename: string;
    content: Buffer;
  };
}

function normalizeFormats(formats: ExportFormat[]): ExportFormat[] {
  return Array.from(new Set(formats));
}

function artifactMimeType(format: ExportFormat | "snapshot"): string {
  if (format === "markdown") return "text/markdown; charset=utf-8";
  if (format === "latex") return "application/x-tex; charset=utf-8";
  if (format === "pdf") return "application/pdf";
  return "application/json; charset=utf-8";
}

export async function buildExportReport(
  options: BuildExportReportOptions,
): Promise<BuildExportReportResult> {
  assertValidSnapshot(options.snapshot);

  const formats = normalizeFormats(options.formats);
  const model = options.documentModel || buildDocumentModel(options.snapshot);
  const artifacts: ExportArtifact[] = [];
  const traceDiagramAssets = await buildTraceDiagramAssets(model);

  let latexContent: string | null = null;

  if (formats.includes("markdown")) {
    const markdown = renderMarkdownReport({
      snapshot: options.snapshot,
      documentModel: model,
    });

    artifacts.push({
      format: "markdown",
      filename: MARKDOWN_FILENAME,
      mimeType: artifactMimeType("markdown"),
      content: markdown,
    });
  }

  if (formats.includes("latex") || formats.includes("pdf")) {
    latexContent = renderLatexReport({
      snapshot: options.snapshot,
      documentModel: model,
    });

    if (formats.includes("latex")) {
      artifacts.push({
        format: "latex",
        filename: LATEX_FILENAME,
        mimeType: artifactMimeType("latex"),
        content: latexContent,
      });
    }
  }

  if (formats.includes("pdf")) {
    if (!latexContent) {
      throw new Error("LaTeX content was not generated before PDF compilation.");
    }

    try {
      const compiled = compileLatexToPdf({
        texContent: latexContent,
        extraFiles: traceDiagramAssets.map((asset) => ({
          relativePath: asset.filename,
          content: asset.content,
        })),
        ...options.pdf,
      });

      artifacts.push({
        format: "pdf",
        filename: PDF_FILENAME,
        mimeType: artifactMimeType("pdf"),
        content: compiled.pdfBuffer,
      });
    } catch (error) {
      if (error instanceof LatexCompilationError) {
        throw error;
      }
      throw new LatexCompilationError(
        "compilation_failed",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  if (options.includeSnapshotJson) {
    artifacts.push({
      format: "snapshot",
      filename: "snapshot.json",
      mimeType: artifactMimeType("snapshot"),
      content: JSON.stringify(options.snapshot, null, 2),
    });
  }

  for (const asset of traceDiagramAssets) {
    artifacts.push({
      format: "asset",
      filename: asset.filename,
      mimeType: asset.mimeType,
      content: asset.content,
    });
  }

  if (options.includeZipBundle) {
    const bundle = await createZipBundle(
      artifacts.map((artifact) => ({
        filename: artifact.filename,
        content: artifact.content,
      })),
      {
        snapshotId: options.snapshot.snapshotId,
        contentHash: options.snapshot.contentHash,
        createdAt: options.snapshot.createdAt,
        formats,
      },
    );

    return {
      snapshot: options.snapshot,
      documentModel: model,
      artifacts,
      bundle: {
        filename: bundle.filename,
        content: bundle.buffer,
      },
    };
  }

  return {
    snapshot: options.snapshot,
    documentModel: model,
    artifacts,
  };
}
