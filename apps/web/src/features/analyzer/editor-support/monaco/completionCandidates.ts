import { extractTextualSymbols } from "@/features/analyzer/manual-guidance/context/extractSymbols";

import { resolveSnippetAlias } from "../catalog/snippetAliases";
import {
  completionSnippetCatalog,
  getSnippetSearchTerms,
  localizeSnippet,
  type SnippetDefinition,
  type SupportedLocale,
} from "../catalog/snippetCatalog";

const IDENTIFIER_KEYWORDS = new Set([
  "BEGIN",
  "END",
  "IF",
  "THEN",
  "ELSE",
  "FOR",
  "TO",
  "WHILE",
  "DO",
  "REPEAT",
  "UNTIL",
  "CALL",
  "RETURN",
  "PRINT",
  "MOD",
  "DIV",
  "AND",
  "OR",
  "NOT",
  "NULL",
  "true",
  "false",
]);

export interface IdentifierCompletionCandidate {
  readonly type: "identifier";
  readonly identifierKind: "parameter" | "variable";
  readonly label: string;
  readonly key: string;
}

export interface SnippetCompletionCandidate {
  readonly type: "snippet";
  readonly snippetKind: "snippet" | "algorithm";
  readonly snippet: SnippetDefinition;
  readonly key: string;
}

export type CompletionCandidate =
  | IdentifierCompletionCandidate
  | SnippetCompletionCandidate;

function normalizeCompletionText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function matchesPrefix(value: string, prefix: string): boolean {
  const normalizedPrefix = normalizeCompletionText(prefix);
  return (
    normalizedPrefix.length === 0 ||
    normalizeCompletionText(value).startsWith(normalizedPrefix)
  );
}

function pushIdentifierCandidate(
  candidates: IdentifierCompletionCandidate[],
  seen: Set<string>,
  label: string,
  identifierKind: "parameter" | "variable",
  prefix: string,
) {
  const normalizedLabel = normalizeCompletionText(label);
  if (
    normalizedLabel.length === 0 ||
    IDENTIFIER_KEYWORDS.has(label) ||
    seen.has(normalizedLabel) ||
    !matchesPrefix(label, prefix)
  ) {
    return;
  }

  seen.add(normalizedLabel);
  candidates.push({
    type: "identifier",
    identifierKind,
    label,
    key: `${identifierKind}:${normalizedLabel}`,
  });
}

export function extractIdentifierCandidates(
  sourceCode: string,
  prefix: string,
): IdentifierCompletionCandidate[] {
  const normalizedPrefix = normalizeCompletionText(prefix);
  const seen = new Set<string>();
  const candidates: IdentifierCompletionCandidate[] = [];
  const symbols = extractTextualSymbols(sourceCode, sourceCode.length);

  for (const parameter of symbols.parameters) {
    pushIdentifierCandidate(
      candidates,
      seen,
      parameter.name,
      "parameter",
      normalizedPrefix,
    );
  }

  for (const variable of symbols.variables) {
    pushIdentifierCandidate(
      candidates,
      seen,
      variable.name,
      "variable",
      normalizedPrefix,
    );
  }

  return candidates;
}

function buildSnippetCandidateKey(
  snippet: SnippetDefinition,
  locale: SupportedLocale,
): string {
  const localizedSnippet = localizeSnippet(snippet, locale);
  const normalizedLabel = normalizeCompletionText(localizedSnippet.label);
  const normalizedInsertText = localizedSnippet.insertText
    .replace(/\s+/g, " ")
    .trim();

  return `${normalizedLabel}:${normalizedInsertText}`;
}

function isAlgorithmSnippet(snippet: SnippetDefinition): boolean {
  return snippet.id.startsWith("catalog-");
}

export function buildSnippetCandidates(
  prefix: string,
  locale: SupportedLocale,
): SnippetCompletionCandidate[] {
  const normalizedPrefix = normalizeCompletionText(prefix);
  const exactSnippet = normalizedPrefix
    ? resolveSnippetAlias(normalizedPrefix, locale)
    : null;
  const matchingSnippets =
    normalizedPrefix.length === 0
      ? completionSnippetCatalog
      : completionSnippetCatalog.filter((snippet) =>
          getSnippetSearchTerms(snippet, locale).some((term) =>
            term.startsWith(normalizedPrefix),
          ),
        );

  const orderedSnippets = [...matchingSnippets].sort((left, right) => {
    const leftIsAlgorithm = isAlgorithmSnippet(left);
    const rightIsAlgorithm = isAlgorithmSnippet(right);
    if (leftIsAlgorithm !== rightIsAlgorithm) {
      return leftIsAlgorithm ? 1 : -1;
    }

    const leftIsExact = exactSnippet?.id === left.id;
    const rightIsExact = exactSnippet?.id === right.id;
    if (leftIsExact !== rightIsExact) {
      return leftIsExact ? -1 : 1;
    }

    return right.priority - left.priority;
  });

  const dedupedCandidates: SnippetCompletionCandidate[] = [];
  const seenKeys = new Set<string>();

  for (const snippet of orderedSnippets) {
    const key = buildSnippetCandidateKey(snippet, locale);
    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    dedupedCandidates.push({
      type: "snippet",
      snippetKind: isAlgorithmSnippet(snippet) ? "algorithm" : "snippet",
      snippet,
      key,
    });
  }

  return dedupedCandidates;
}

export function buildCompletionCandidates(
  sourceCode: string,
  prefix: string,
  locale: string,
  limit = 5,
): CompletionCandidate[] {
  const normalizedLocale: SupportedLocale = locale === "en" ? "en" : "es";
  const identifiers = extractIdentifierCandidates(sourceCode, prefix);
  const snippets = buildSnippetCandidates(prefix, normalizedLocale);

  return [...identifiers, ...snippets].slice(0, limit);
}
