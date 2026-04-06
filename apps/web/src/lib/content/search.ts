import type { SearchIndexEntry } from "@aa/content-catalog";

import type { ContentModuleSummary, ContentSearchMatch } from "./types";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function buildSnippet(text: string, normalizedQuery: string): string {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) {
    return "";
  }

  const normalizedText = cleanText.toLowerCase();
  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) {
    return cleanText.length <= 180 ? cleanText : `${cleanText.slice(0, 179)}…`;
  }

  const start = Math.max(0, index - 60);
  const end = Math.min(cleanText.length, index + normalizedQuery.length + 80);
  const excerpt = cleanText.slice(start, end).trim();

  const prefix = start > 0 ? "…" : "";
  const suffix = end < cleanText.length ? "…" : "";
  return `${prefix}${excerpt}${suffix}`;
}

export function searchContentIndex(
  entries: SearchIndexEntry[],
  modules: ContentModuleSummary[],
  query: string,
): ContentSearchMatch[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return [];
  }

  const moduleTitleById = new Map(
    modules.map((module) => [module.moduleId, module.title]),
  );

  return entries
    .map((entry) => {
      const title = normalize(entry.title);
      const moduleTitle = normalize(moduleTitleById.get(entry.moduleId) ?? "");
      const aliases = entry.aliases.map(normalize);
      const keywords = entry.keywords.map(normalize);
      const tags = entry.tags.map(normalize);
      const text = normalize(entry.text);

      if (
        !title.includes(normalizedQuery) &&
        !moduleTitle.includes(normalizedQuery) &&
        !aliases.some((value) => value.includes(normalizedQuery)) &&
        !keywords.some((value) => value.includes(normalizedQuery)) &&
        !tags.some((value) => value.includes(normalizedQuery)) &&
        !text.includes(normalizedQuery)
      ) {
        return null;
      }

      let score = 0;
      if (title === normalizedQuery) score += 120;
      if (title.startsWith(normalizedQuery)) score += 80;
      if (title.includes(normalizedQuery)) score += 50;
      if (moduleTitle === normalizedQuery) score += 45;
      if (moduleTitle.startsWith(normalizedQuery)) score += 30;
      if (moduleTitle.includes(normalizedQuery)) score += 18;

      if (aliases.some((value) => value === normalizedQuery)) score += 50;
      else if (aliases.some((value) => value.startsWith(normalizedQuery)))
        score += 30;
      else if (aliases.some((value) => value.includes(normalizedQuery)))
        score += 18;

      if (keywords.some((value) => value === normalizedQuery)) score += 30;
      else if (keywords.some((value) => value.startsWith(normalizedQuery)))
        score += 18;
      else if (keywords.some((value) => value.includes(normalizedQuery)))
        score += 10;

      if (tags.some((value) => value === normalizedQuery)) score += 24;
      else if (tags.some((value) => value.startsWith(normalizedQuery))) score += 16;
      else if (tags.some((value) => value.includes(normalizedQuery))) score += 8;

      if (text.includes(normalizedQuery)) score += 6;

      return {
        entry,
        score,
        moduleTitle: moduleTitleById.get(entry.moduleId) ?? entry.moduleId,
        snippet: buildSnippet(entry.text, normalizedQuery),
      };
    })
    .filter(
      (match): match is ContentSearchMatch =>
        match !== null && match.score > 0,
    )
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.entry.title.localeCompare(right.entry.title);
    });
}
