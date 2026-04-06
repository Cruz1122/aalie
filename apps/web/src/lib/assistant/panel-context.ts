import type { AnalysisStepBundle } from "@aa/types";

import { translateBackendContent } from "@/lib/backend-content-translator";

export type AssistantLocale = "es" | "en";

const DEFAULT_DETAIL_MAX_CHARS = 320;

export function normalizeAssistantLocale(locale: string): AssistantLocale {
  return locale.toLowerCase().startsWith("es") ? "es" : "en";
}

export function truncateAssistantDetail(
  value: string | undefined | null,
  maxChars = DEFAULT_DETAIL_MAX_CHARS,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, maxChars - 1).trimEnd()}…`;
}

function humanizeToken(value: string): string {
  return value.replaceAll("_", " ");
}

export function buildBundleDetailNotes(
  bundle: AnalysisStepBundle | null | undefined,
  locale: string,
  options?: {
    maxSteps?: number;
    includeMath?: boolean;
  },
): string[] {
  if (!bundle) {
    return [];
  }

  const safeLocale = normalizeAssistantLocale(locale);
  const text = (es: string, en: string) => (safeLocale === "es" ? es : en);
  const notes: string[] = [];

  notes.push(
    text(
      `Walkthrough visible con método ${humanizeToken(bundle.method)}.`,
      `Visible walkthrough using ${humanizeToken(bundle.method)}.`,
    ),
  );

  if (bundle.overallStatus !== "complete") {
    notes.push(
      text(
        `Estado del walkthrough: ${humanizeToken(bundle.overallStatus)}.`,
        `Walkthrough status: ${humanizeToken(bundle.overallStatus)}.`,
      ),
    );
  }

  const maxSteps = options?.maxSteps ?? 3;
  const includeMath = options?.includeMath ?? true;

  bundle.steps.slice(0, maxSteps).forEach((step, index) => {
    const translatedTitle =
      truncateAssistantDetail(translateBackendContent(step.title, safeLocale), 120) ||
      step.title;
    const translatedSummary =
      truncateAssistantDetail(
        translateBackendContent(step.summary, safeLocale),
      ) || translatedTitle;

    notes.push(
      text(
        `Paso ${index + 1} (${translatedTitle}): ${translatedSummary}`,
        `Step ${index + 1} (${translatedTitle}): ${translatedSummary}`,
      ),
    );

    if (!includeMath) {
      return;
    }

    const primaryLatex = truncateAssistantDetail(step.math.primaryLatex, 220);
    if (primaryLatex) {
      notes.push(
        text(
          `Fórmula clave ${index + 1}: ${primaryLatex}`,
          `Key formula ${index + 1}: ${primaryLatex}`,
        ),
      );
    }
  });

  return notes;
}
