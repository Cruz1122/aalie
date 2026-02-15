/**
 * Tipos para el sistema de prompts parametrizados por idioma.
 */

export type SupportedLocale = "es" | "en";

export type LLMJob =
  | "classify"
  | "parser_assist"
  | "general"
  | "simplifier"
  | "repair"
  | "compare";

export interface RecursionDiagramParams {
  depth_limit?: number;
}
