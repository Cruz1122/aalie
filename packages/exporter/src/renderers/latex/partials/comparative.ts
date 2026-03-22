import type { DocumentSection } from "../../document-model-builder";
import { getExportI18n } from "../../../infrastructure/i18n";

import { renderLatexSection } from "./common";

export function renderComparativeLatex(section: DocumentSection, locale: "es" | "en"): string {
  return renderLatexSection(section, getExportI18n(locale));
}
