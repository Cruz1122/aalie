import type { DocumentSection } from "../../document-model-builder";
import { getExportI18n } from "../../../infrastructure/i18n";

import { renderMarkdownSection } from "./common";

export function renderRecursiveMarkdown(section: DocumentSection, locale: "es" | "en"): string {
  return renderMarkdownSection(section, getExportI18n(locale));
}
