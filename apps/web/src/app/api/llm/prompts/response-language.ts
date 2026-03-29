/**
 * Instrucciones de idioma de respuesta para prompts.
 * Se añaden al final de los prompts para indicar en qué idioma debe responder la IA.
 */

import type { SupportedLocale } from "./types";

export function getResponseLanguageInstruction(
  locale: SupportedLocale,
): string {
  return locale === "en"
    ? `\n\nRESPONSE LANGUAGE (CRITICAL)
- ALWAYS respond in English. Do not use Spanish or other languages.
- All explanations, comments, and natural language output must be in English.`
    : `\n\nIDIOMA DE RESPUESTA (CRÍTICO)
- Responde SIEMPRE en español. No uses inglés ni otros idiomas.
- Todas las explicaciones, comentarios y salida en lenguaje natural deben estar en español.`;
}
