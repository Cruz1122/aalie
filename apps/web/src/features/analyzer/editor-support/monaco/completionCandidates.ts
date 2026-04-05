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

const SIGNATURE_REGEX = /^\s*[A-Za-z_][A-Za-z0-9_]*\s*\(([^)]*)\)\s*BEGIN\b/gm;
const ASSIGNMENT_REGEX =
  /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[[^\]]+\])?\s*<-/;
const FOR_LOOP_REGEX = /^\s*FOR\s+([A-Za-z_][A-Za-z0-9_]*)\s*<-/;

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
  return prefix.length === 0 || normalizeCompletionText(value).startsWith(prefix);
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

function extractSignatureParameters(sourceCode: string): string[] {
  const parameters: string[] = [];

  for (const match of sourceCode.matchAll(SIGNATURE_REGEX)) {
    const rawParameters = match[1] ?? "";
    for (const parameter of rawParameters.split(",")) {
      const identifier = parameter.match(/[A-Za-z_][A-Za-z0-9_]*/)?.[0];
      if (identifier) {
        parameters.push(identifier);
      }
    }
  }

  return parameters;
}

function extractAssignedVariables(sourceCode: string): string[] {
  const variables: string[] = [];

  for (const line of sourceCode.split("\n")) {
    const loopMatch = line.match(FOR_LOOP_REGEX);
    if (loopMatch?.[1]) {
      variables.push(loopMatch[1]);
      continue;
    }

    const assignmentMatch = line.match(ASSIGNMENT_REGEX);
    if (assignmentMatch?.[1]) {
      variables.push(assignmentMatch[1]);
    }
  }

  return variables;
}

export function extractIdentifierCandidates(
  sourceCode: string,
  prefix: string,
): IdentifierCompletionCandidate[] {
  const normalizedPrefix = normalizeCompletionText(prefix);
  const seen = new Set<string>();
  const candidates: IdentifierCompletionCandidate[] = [];

  for (const parameter of extractSignatureParameters(sourceCode)) {
    pushIdentifierCandidate(
      candidates,
      seen,
      parameter,
      "parameter",
      normalizedPrefix,
    );
  }

  for (const variable of extractAssignedVariables(sourceCode)) {
    pushIdentifierCandidate(
      candidates,
      seen,
      variable,
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
