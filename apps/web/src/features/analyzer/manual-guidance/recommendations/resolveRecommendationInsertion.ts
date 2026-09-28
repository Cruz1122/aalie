import {
  getSnippetById,
  localizeSnippet,
} from "@/features/analyzer/editor-support/catalog/snippetCatalog";

import { rankRecommendations } from "./rankRecommendations";
import type { GuidanceRecommendation } from "./types";
import type { EditorContext } from "../context/types";

export interface RecommendationInsertion {
  readonly recommendationId: string;
  readonly snippetId?: string;
  readonly snippetText: string;
  readonly replaceStartOffset?: number;
  readonly replaceEndOffset?: number;
}

export function isRecommendationCurrent(
  recommendation: GuidanceRecommendation | null | undefined,
  context: EditorContext,
): boolean {
  if (!recommendation) return false;
  return rankRecommendations(context, { limit: 8 }).some(
    (candidate) =>
      candidate.id === recommendation.id &&
      candidate.action === recommendation.action &&
      candidate.intent === recommendation.intent &&
      candidate.reason === recommendation.reason &&
      candidate.snippetId === recommendation.snippetId,
  );
}

function getDynamicHeaderName(linePrefix: string): string | null {
  const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)$/u.exec(linePrefix);
  return match?.[1] ?? null;
}

function buildDynamicHeaderInsertion(
  linePrefix: string,
  context: EditorContext,
  localizedSnippetText: string,
): Pick<
  RecommendationInsertion,
  "snippetText" | "replaceStartOffset" | "replaceEndOffset"
> {
  const name = getDynamicHeaderName(linePrefix);
  if (!name) {
    return { snippetText: localizedSnippetText };
  }

  const namePlaceholder = /\$\{1:([^}]+)\}/u.exec(localizedSnippetText);
  const snippetText = namePlaceholder
    ? localizedSnippetText.replace(namePlaceholder[0], `\${1:${name}}`)
    : localizedSnippetText;
  const nameStart = context.cursor.offset - name.length;

  return {
    snippetText,
    replaceStartOffset: nameStart,
    replaceEndOffset: context.cursor.offset,
  };
}

function scalarParameterName(context: EditorContext): string | null {
  return (
    context.symbols.parameters.find((symbol) =>
      /^[A-Za-z_][A-Za-z0-9_]*$/u.test(symbol.name),
    )?.name ?? null
  );
}

function latestVariableName(context: EditorContext): string | null {
  return context.symbols.variables.at(-1)?.name ?? null;
}

export function personalizeSnippet(
  snippetText: string,
  context: EditorContext,
): string {
  const scalar = scalarParameterName(context);
  const variable = latestVariableName(context);
  const value = variable ?? scalar;

  return snippetText.replace(
    /\$\{(\d+):([^}]+)\}/gu,
    (full, index: string, rawDefault: string) => {
      const key = rawDefault.toLowerCase();
      let replacement: string | null = null;
      if ((key === "condicion" || key === "condition") && scalar) {
        replacement = `${scalar} > 0`;
      } else if ((key === "valor" || key === "value") && value) {
        replacement = value;
      } else if (key === "n" && scalar && scalar !== "n") {
        replacement = scalar;
      } else if (
        (key === "parametros" ||
          key === "parameters" ||
          key === "params" ||
          key === "parametro" ||
          key === "parameter") &&
        scalar
      ) {
        replacement = scalar;
      }

      if (!replacement || replacement === rawDefault) return full;
      return `\${${index}:${replacement}}`;
    },
  );
}

function isOperandAtEnd(value: string): boolean {
  return /(?:[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|\]|\))\s*$/u.test(value);
}

function isOperatorAtEnd(value: string): boolean {
  return /(?:<=|>=|!=|=|<|>|\bAND\b|\bOR\b|\bNOT\b)\s*$/iu.test(value);
}

function buildComparisonInsertion(
  linePrefix: string,
  context: EditorContext,
): string {
  const prefix = linePrefix.trimEnd();
  const scalar = scalarParameterName(context);
  const variable = latestVariableName(context);
  const right = variable && variable !== scalar ? variable : "limite";
  const left = scalar ?? variable ?? "n";

  if (isOperatorAtEnd(prefix)) return `\${1:${left}}`;
  if (isOperandAtEnd(prefix)) return ` <= \${1:${right}}`;
  return `\${1:${left}} <= \${2:${right}}`;
}

function buildLogicalInsertion(linePrefix: string, operator: "AND" | "OR") {
  return /\s$/u.test(linePrefix) ? `${operator} ` : ` ${operator} `;
}

function firstAvailableSymbol(context: EditorContext): string {
  return (
    context.symbols.parameters[0]?.name ??
    context.symbols.variables[0]?.name ??
    "valor"
  );
}

function buildContextualSnippet(
  recommendation: GuidanceRecommendation,
  context: EditorContext,
  linePrefix: string,
): string | null {
  switch (recommendation.id) {
    case "comparison":
      return buildComparisonInsertion(linePrefix, context);
    case "and":
      return buildLogicalInsertion(linePrefix, "AND");
    case "or":
      return buildLogicalInsertion(linePrefix, "OR");
    case "not":
      return "NOT (${1:condition})";
    case "symbols":
      return `\${1:${firstAvailableSymbol(context)}}`;
    case "parameter-symbols":
      return "${1:parameter}";
    case "scalar-parameter":
      return "n";
    case "array-parameter":
      return "A[n]";
    case "range-parameter":
      return "A[n]..[m]";
    case "object-parameter":
      return "Clase objeto";
    default:
      return null;
  }
}

export function resolveRecommendationInsertion(
  recommendation: GuidanceRecommendation | null | undefined,
  context: EditorContext,
  locale: string,
  linePrefix = "",
): RecommendationInsertion | null {
  if (!recommendation || recommendation.action === "analyze") return null;

  if (recommendation.snippetId) {
    const snippet = getSnippetById(recommendation.snippetId);
    if (!snippet || snippet.status === "hidden") return null;

    const localizedSnippet = localizeSnippet(snippet, locale);
    if (recommendation.id === "algorithm-header") {
      const dynamic = buildDynamicHeaderInsertion(
        linePrefix,
        context,
        localizedSnippet.insertText,
      );
      return {
        recommendationId: recommendation.id,
        snippetId: recommendation.snippetId,
        ...dynamic,
        snippetText: personalizeSnippet(dynamic.snippetText, context),
      };
    }

    return {
      recommendationId: recommendation.id,
      snippetId: recommendation.snippetId,
      snippetText: personalizeSnippet(localizedSnippet.insertText, context),
    };
  }

  const snippetText = buildContextualSnippet(
    recommendation,
    context,
    linePrefix,
  );
  if (!snippetText) return null;

  return {
    recommendationId: recommendation.id,
    snippetText: personalizeSnippet(snippetText, context),
  };
}
