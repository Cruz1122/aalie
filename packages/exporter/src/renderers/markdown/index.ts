import type { AalieAnalysisSnapshotV1 } from "@aa/types";

import { getExportI18n } from "../../infrastructure/i18n";
import { buildDocumentModel, type DocumentModel, type DocumentSection } from "../document-model-builder";
import { renderComparativeMarkdown } from "./partials/comparative";
import { renderMarkdownSection } from "./partials/common";
import { renderIterativeMarkdown } from "./partials/iterative";
import { renderRecursiveMarkdown } from "./partials/recursive";

export interface RenderMarkdownOptions {
  snapshot: AalieAnalysisSnapshotV1;
  documentModel?: DocumentModel;
}

function renderSection(section: DocumentSection, locale: "es" | "en"): string {
  const i18n = getExportI18n(locale);
  if (section.id === "iterative") {
    return renderIterativeMarkdown(section, locale);
  }
  if (section.id === "recursive") {
    return renderRecursiveMarkdown(section, locale);
  }
  if (section.id === "comparative") {
    return renderComparativeMarkdown(section, locale);
  }
  return renderMarkdownSection(section, i18n);
}

function renderFrontMatter(model: DocumentModel): string {
  const frontMatterLines = [
    `# ${model.title}`,
    "",
    `- snapshotId: ${model.snapshotId}`,
    `- contentHash: ${model.contentHash}`,
    `- analysisId: ${model.analysisId}`,
    `- createdAt: ${model.createdAt}`,
    "",
    `> ${model.disclaimer}`,
  ];

  return frontMatterLines.join("\n");
}

export function renderMarkdownReport(options: RenderMarkdownOptions): string {
  const model = options.documentModel || buildDocumentModel(options.snapshot);
  const sections = model.sections
    .map((section) => renderSection(section, model.locale))
    .join("\n\n");
  return `${renderFrontMatter(model)}\n\n${sections}\n`;
}
