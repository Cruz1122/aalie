/**
 * Índice central de prompts parametrizados por idioma.
 * Obtiene el prompt adecuado según el job y el locale del usuario.
 */

import { classify } from "./classify";
import { compare } from "./compare";
import { generalBase } from "./general";
import { parserAssistBase } from "./parser_assist";
import { repair } from "./repair";
import { getResponseLanguageInstruction } from "./response-language";
import type { LLMJob, SupportedLocale } from "./types";

const SUPPORTED_LOCALES: SupportedLocale[] = ["es", "en"];

function normalizeLocale(locale: string | undefined): SupportedLocale {
  if (!locale || typeof locale !== "string") return "es";
  const normalized = locale.toLowerCase().slice(0, 2);
  return SUPPORTED_LOCALES.includes(normalized as SupportedLocale)
    ? (normalized as SupportedLocale)
    : "es";
}

/**
 * Obtiene el prompt del sistema para un job dado, según el idioma del usuario.
 */
export function getPrompt(job: LLMJob, locale?: string): string {
  const loc = normalizeLocale(locale);

  switch (job) {
    case "classify":
      return classify[loc];
    case "parser_assist":
      return parserAssistBase + getResponseLanguageInstruction(loc);
    case "general":
      return generalBase + getResponseLanguageInstruction(loc);
    case "repair":
      return repair[loc];
    case "compare":
      return compare[loc];
    default:
      return parserAssistBase + getResponseLanguageInstruction(loc);
  }
}

export { getExplanationLanguageInstruction, getExplanationFormatInstruction } from "./response-language";
export type { LLMJob, SupportedLocale, RecursionDiagramParams } from "./types";
