import type { Term } from "./types.js";

export type TermIndexEntry = {
  termId: string;
  label: string;
  definition: string;
  patterns: string[];
  primarySectionRef?: {
    moduleId: string;
    sectionId: string;
  };
  maxOccurrencesPerSection: number;
};

/**
 * Normalizes text by converting to lowercase and removing accents.
 */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Builds an optimized index for term auto-detection.
 */
export function buildTermsIndex(terms: Term[] | undefined): TermIndexEntry[] {
  if (!terms) {
    return [];
  }

  const entries: TermIndexEntry[] = [];

  for (const term of terms) {
    // Phase 2: autoLink default is true if not specified
    if (term.autoLink === false) {
      continue;
    }

    const rawPatterns = [term.label, ...(term.aliases ?? [])];
    const patterns = rawPatterns
      .map((p) => normalizeForMatch(p))
      .filter((p) => {
        // Phase 2: Don't index terms < 4 characters unless safe
        // For now, we consider them safe if they were explicitly provided as aliases
        // but the label itself must be at least 4 chars if not an alias.
        // Let's just follow the 4-char rule strictly for auto-linking unless it's a known acronym.
        return p.length >= 4 || term.aliases?.includes(p);
      });

    if (patterns.length === 0) {
      continue;
    }

    entries.push({
      termId: term.termId,
      label: term.label,
      definition: term.definition,
      patterns,
      primarySectionRef: term.primarySectionRef,
      maxOccurrencesPerSection: term.match?.maxOccurrencesPerSection ?? 2,
    });
  }

  // Phase 2 Rule: Sort patterns by length descending in the matching phase.
  // We can't easily do it here because one entry has multiple patterns.
  // We'll return the entries as is and the renderer will flatten and sort them.

  return entries;
}
