import {
  getEnabledExamples,
  getLocalizedExampleSource,
  type ExampleCatalogItem,
  type ExampleLocale,
} from "@/lib/examples/catalog";

import type { SnippetDefinition } from "./snippetCatalog";

function normalizeAlias(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function addAliasVariants(target: Set<string>, value: string) {
  const normalized = normalizeAlias(value);
  if (!normalized) {
    return;
  }

  target.add(normalized);
  const words = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  for (const word of words) {
    target.add(word);
  }
  if (words.length > 1) {
    target.add(words.join(""));
  }
}

function extractProcedureName(sourceCode: string): string | null {
  const match = sourceCode.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(/m);
  const name = match?.[1]?.trim() ?? "";
  return name.length > 0 ? name : null;
}

function buildAliases(
  example: ExampleCatalogItem,
  locale: ExampleLocale,
): string[] {
  const aliases = new Set<string>([
    example.slug,
    example.slug.replace(/-/g, ""),
  ]);
  const sources = [
    getLocalizedExampleSource(example, "es"),
    getLocalizedExampleSource(example, "en"),
  ];

  for (const title of [example.copy.es.title, example.copy.en.title]) {
    addAliasVariants(aliases, title);
  }

  for (const tag of [...example.copy.es.tags, ...example.copy.en.tags]) {
    addAliasVariants(aliases, tag);
  }

  for (const source of sources) {
    const procedureName = extractProcedureName(source);
    if (procedureName) {
      addAliasVariants(aliases, procedureName);
    }
  }

  if (locale === "en") {
    addAliasVariants(aliases, example.copy.en.title);
  } else {
    addAliasVariants(aliases, example.copy.es.title);
  }

  return [...aliases];
}

function inferAlgorithmKind(
  example: ExampleCatalogItem,
): SnippetDefinition["exampleAlgorithmKind"] {
  return example.category === "iterativos" ? "iterative" : "recursive";
}

function buildAlgorithmSnippet(
  example: ExampleCatalogItem,
  index: number,
): SnippetDefinition {
  const sourceEs = getLocalizedExampleSource(example, "es");
  const sourceEn = getLocalizedExampleSource(example, "en");
  const previewEs = sourceEs.split("\n")[0] ?? example.copy.es.title;
  const previewEn = sourceEn.split("\n")[0] ?? example.copy.en.title;

  return {
    id: `catalog-${example.id}`,
    label: example.copy.es.title,
    shortLabel: example.copy.es.title,
    category: "templates",
    priority: 800 - index,
    aliases: buildAliases(example, "es"),
    insertKind: "template",
    insertText: sourceEs,
    placeholders: [],
    documentationShort: example.copy.es.summary,
    documentationPedagogical: example.copy.es.summary,
    preview: previewEs,
    contextRules: ["lineStart"],
    requiresSelection: false,
    supportsSelectionWrap: false,
    parserExpectation: "parseable",
    status: "active",
    exampleAlgorithmKind: inferAlgorithmKind(example),
    supportsAnalyze: true,
    supportsDetectMethods: example.verifiedMethods.length > 0,
    expectedUseCase: example.copy.es.summary,
    localizations: {
      en: {
        label: example.copy.en.title,
        shortLabel: example.copy.en.title,
        aliases: buildAliases(example, "en"),
        insertText: sourceEn,
        documentationShort: example.copy.en.summary,
        documentationPedagogical: example.copy.en.summary,
        preview: previewEn,
        expectedUseCase: example.copy.en.summary,
      },
    },
  };
}

export const algorithmCompletionSnippets: SnippetDefinition[] =
  getEnabledExamples().map(buildAlgorithmSnippet);
