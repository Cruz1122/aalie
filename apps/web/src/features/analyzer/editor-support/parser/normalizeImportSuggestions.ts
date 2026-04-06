export interface ImportNormalizationSuggestion {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly reason: string;
}

const NORMALIZATION_RULES = [
  {
    id: "assign-unicode",
    from: "🡨",
    to: "<-",
    reason: "Usa <- para asignación.",
  },
  {
    id: "comment-unicode",
    from: "►",
    to: "//",
    reason: "El comentario oficial debe empezar con //.",
  },
  {
    id: "le-unicode",
    from: "≤",
    to: "<=",
    reason: "Usa <= como relacional visible.",
  },
  {
    id: "ge-unicode",
    from: "≥",
    to: ">=",
    reason: "Usa >= como relacional visible.",
  },
  {
    id: "neq-unicode",
    from: "≠",
    to: "!=",
    reason: "Usa != como relacional visible.",
  },
  {
    id: "neq-pascal",
    from: "<>",
    to: "!=",
    reason: "Usa != como desigualdad visible.",
  },
  {
    id: "assign-pascal",
    from: ":=",
    to: "<-",
    reason: "El operador oficial visible de asignación es <-.",
  },
  {
    id: "assign-arrow",
    from: "←",
    to: "<-",
    reason: "Usa <- como asignación visible.",
  },
  {
    id: "assign-long-arrow",
    from: "⟵",
    to: "<-",
    reason: "Usa <- como asignación visible.",
  },
] as const;

const KEYWORD_REGEX =
  /\b(begin|end|if|then|else|for|to|do|while|repeat|until|return|call|and|or|not|null|true|false)\b/g;

export function getImportNormalizationSuggestions(
  source: string,
): ImportNormalizationSuggestion[] {
  const suggestions: ImportNormalizationSuggestion[] = [];

  for (const rule of NORMALIZATION_RULES) {
    if (source.includes(rule.from)) {
      suggestions.push(rule);
    }
  }

  const lowercaseKeywords = source.match(KEYWORD_REGEX);
  if (lowercaseKeywords && lowercaseKeywords.length > 0) {
    suggestions.push({
      id: "keywords-uppercase",
      from: lowercaseKeywords[0],
      to: lowercaseKeywords[0].toUpperCase(),
      reason:
        "Conviene escribir las keywords en mayúscula para seguir el estilo oficial.",
    });
  }

  return suggestions;
}
