const PLACEHOLDER_WORDS = [
  "condicion",
  "condition",
  "valor",
  "value",
  "variable",
  "parametros",
  "parameters",
  "parametro",
  "parameter",
  "subrutina",
  "subroutine",
  "comentario",
  "comment",
  "nombre",
] as const;

const PLACEHOLDER_PATTERN = new RegExp(
  `\\b(${PLACEHOLDER_WORDS.join("|")})\\b`,
  "giu",
);

export interface UnresolvedPlaceholder {
  readonly text: string;
  readonly line: number;
  readonly startColumn: number;
  readonly endColumn: number;
}

export function findUnresolvedPlaceholders(
  source: string,
): UnresolvedPlaceholder[] {
  const placeholders: UnresolvedPlaceholder[] = [];

  source.split("\n").forEach((line, index) => {
    const code = line
      .replace(/\/\/.*$/u, "")
      .replace(/"(?:\\.|[^"\\])*"/gu, (match) => " ".repeat(match.length));
    PLACEHOLDER_PATTERN.lastIndex = 0;
    let match = PLACEHOLDER_PATTERN.exec(code);
    while (match?.[1]) {
      placeholders.push({
        text: match[1],
        line: index + 1,
        startColumn: match.index + 1,
        endColumn: match.index + 1 + match[1].length,
      });
      match = PLACEHOLDER_PATTERN.exec(code);
    }
  });

  return placeholders;
}
