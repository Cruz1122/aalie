export const SNIPPET_CATEGORY_ORDER = [
  "recommended",
  "conditions",
  "loops",
  "functions",
  "templates",
  "other",
] as const;

export type SnippetCategory = (typeof SNIPPET_CATEGORY_ORDER)[number];

export const SNIPPET_CATEGORY_LABEL_KEYS: Record<SnippetCategory, string> = {
  recommended: "recommended",
  conditions: "conditions",
  loops: "loops",
  functions: "functions",
  other: "other",
  templates: "templates",
};
