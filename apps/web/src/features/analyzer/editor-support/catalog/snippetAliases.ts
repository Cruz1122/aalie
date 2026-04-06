import {
  completionSnippetCatalog,
  getSnippetSearchTerms,
  type SnippetDefinition,
  type SupportedLocale,
} from "./snippetCatalog";

function normalizeAlias(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function buildSnippetAliasMap(
  locale: SupportedLocale,
): Map<string, SnippetDefinition> {
  const aliases = new Map<string, SnippetDefinition>();

  for (const snippet of completionSnippetCatalog) {
    for (const alias of getSnippetSearchTerms(snippet, locale)) {
      if (!aliases.has(alias)) {
        aliases.set(alias, snippet);
      }
    }
  }

  return aliases;
}

const SNIPPET_ALIAS_MAPS: Record<
  SupportedLocale,
  Map<string, SnippetDefinition>
> = {
  es: buildSnippetAliasMap("es"),
  en: buildSnippetAliasMap("en"),
};

export function resolveSnippetAlias(
  input: string,
  locale = "es",
): SnippetDefinition | null {
  const normalizedLocale: SupportedLocale = locale === "en" ? "en" : "es";
  return (
    SNIPPET_ALIAS_MAPS[normalizedLocale].get(normalizeAlias(input)) ?? null
  );
}
