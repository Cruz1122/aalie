import type { AalieAnalysisSnapshotV1 } from "@aa/types";

import { readLatexTemplate } from "../../infrastructure/assets/asset-registry";
import { getExportI18n } from "../../infrastructure/i18n";
import {
  buildDocumentModel,
  type DocumentModel,
  type DocumentSection,
} from "../document-model-builder";
import { renderComparativeLatex } from "./partials/comparative";
import { escapeLatexText, renderLatexBlock, renderLatexSection } from "./partials/common";
import { renderIterativeLatex } from "./partials/iterative";
import { renderRecursiveLatex } from "./partials/recursive";

export interface RenderLatexOptions {
  snapshot: AalieAnalysisSnapshotV1;
  documentModel?: DocumentModel;
  template?: string;
}

function renderSection(section: DocumentSection, locale: "es" | "en"): string {
  const i18n = getExportI18n(locale);
  if (section.id === "iterative") {
    return renderIterativeLatex(section, locale);
  }
  if (section.id === "recursive") {
    return renderRecursiveLatex(section, locale);
  }
  if (section.id === "comparative") {
    return renderComparativeLatex(section, locale);
  }
  return renderLatexSection(section, i18n);
}

function replaceToken(template: string, token: string, value: string): string {
  return template.split(token).join(value);
}

function languagePackage(locale: "es" | "en"): string {
  return locale === "es" ? "spanish,es-tabla" : "english";
}

function renderExecutiveSummary(model: DocumentModel): string {
  const section = model.sections.find((item) => item.id === "executive-summary");
  if (!section) {
    return "";
  }
  const i18n = getExportI18n(model.locale);
  return section.blocks.map((block) => renderLatexBlock(block, i18n)).join("\n\n");
}

function renderContentSections(model: DocumentModel): string {
  return model.sections
    .filter((section) => section.id !== "executive-summary")
    .map((section) => renderSection(section, model.locale))
    .join("\n\n");
}

export function renderLatexReport(options: RenderLatexOptions): string {
  const model = options.documentModel || buildDocumentModel(options.snapshot);
  const i18n = getExportI18n(model.locale);
  let template = options.template || readLatexTemplate();

  const replacements: Record<string, string> = {
    "%%__LANGUAGE_PACKAGE__%%": languagePackage(model.locale),
    "%%__INSTITUTION_A__%%": escapeLatexText(model.institution.institutionLineA),
    "%%__INSTITUTION_B__%%": escapeLatexText(model.institution.institutionLineB),
    "%%__INSTITUTION_C__%%": escapeLatexText(model.institution.institutionLineC),
    "%%__REPORT_CODE__%%": escapeLatexText(model.institution.reportCode),
    "%%__REPORT_VERSION__%%": escapeLatexText(model.institution.reportVersion),
    "%%__REPORT_DATE__%%": escapeLatexText(model.institution.reportDate),
    "%%__VERSION_LABEL__%%": escapeLatexText(i18n.versionLabel),
    "%%__DATE_LABEL__%%": escapeLatexText(i18n.dateLabel),
    "%%__DISCLAIMER__%%": escapeLatexText(model.disclaimer),
    "%%__EXECUTIVE_SUMMARY_TITLE__%%": escapeLatexText(i18n.executiveSummaryTitle),
    "%%__EXECUTIVE_SUMMARY_BODY__%%": renderExecutiveSummary(model),
    "%%__CONTENT_SECTIONS__%%": renderContentSections(model),
  };

  for (const [token, value] of Object.entries(replacements)) {
    template = replaceToken(template, token, value);
  }

  const metaComment = [
    `% snapshotId: ${model.snapshotId}`,
    `% contentHash: ${model.contentHash}`,
    `% analysisId: ${model.analysisId}`,
    `% createdAt: ${model.createdAt}`,
  ].join("\n");

  return `${metaComment}\n${template}`;
}
