export interface SourceToken {
  readonly text: string;
  readonly normalized: string;
  readonly start: number;
  readonly end: number;
  readonly line: number;
  readonly column: number;
  readonly kind:
    | "identifier"
    | "number"
    | "string"
    | "operator"
    | "punctuation";
}

const IDENTIFIER_START = /[A-Za-z_]/;
const IDENTIFIER_CONTINUATION = /[A-Za-z0-9_]/;

export function tokenizeSource(
  source: string,
  endOffset = source.length,
): SourceToken[] {
  const tokens: SourceToken[] = [];
  const limit = Math.max(0, Math.min(endOffset, source.length));
  let index = 0;
  let line = 1;
  let column = 0;

  const advance = (text: string) => {
    for (const character of text) {
      if (character === "\n") {
        line += 1;
        column = 0;
      } else {
        column += 1;
      }
    }
  };

  while (index < limit) {
    const character = source[index] ?? "";

    if (
      character === " " ||
      character === "\t" ||
      character === "\r" ||
      character === "\n"
    ) {
      advance(character);
      index += 1;
      continue;
    }

    if ((character === "/" && source[index + 1] === "/") || character === "►") {
      const start = index;
      while (index < limit && source[index] !== "\n") index += 1;
      advance(source.slice(start, index));
      continue;
    }

    const start = index;
    const startLine = line;
    const startColumn = column;

    if (character === '"') {
      index += 1;
      while (index < limit) {
        const current = source[index] ?? "";
        if (current === "\\") {
          index += Math.min(2, limit - index);
          continue;
        }
        index += 1;
        if (current === '"') break;
      }
      const text = source.slice(start, index);
      advance(text);
      tokens.push({
        text,
        normalized: text,
        start,
        end: index,
        line: startLine,
        column: startColumn,
        kind: "string",
      });
      continue;
    }

    if (IDENTIFIER_START.test(character)) {
      index += 1;
      while (index < limit && IDENTIFIER_CONTINUATION.test(source[index] ?? ""))
        index += 1;
      const text = source.slice(start, index);
      advance(text);
      tokens.push({
        text,
        normalized: text.toLowerCase(),
        start,
        end: index,
        line: startLine,
        column: startColumn,
        kind: "identifier",
      });
      continue;
    }

    if (/\d/.test(character)) {
      index += 1;
      while (index < limit && /\d/.test(source[index] ?? "")) index += 1;
      const text = source.slice(start, index);
      advance(text);
      tokens.push({
        text,
        normalized: text,
        start,
        end: index,
        line: startLine,
        column: startColumn,
        kind: "number",
      });
      continue;
    }

    const twoCharacterOperator = source.slice(index, index + 2);
    const operator = ["<-", ":=", "<=", ">=", "!=", "<>", ".."].includes(
      twoCharacterOperator,
    )
      ? twoCharacterOperator
      : character;
    index += operator.length;
    advance(operator);
    const kind = "(){}[],;.".includes(operator) ? "punctuation" : "operator";
    tokens.push({
      text: operator,
      normalized: operator.toLowerCase(),
      start,
      end: index,
      line: startLine,
      column: startColumn,
      kind,
    });
  }

  return tokens;
}

export function tokenBefore(
  tokens: readonly SourceToken[],
  offset: number,
): SourceToken | undefined {
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    if (tokens[index]!.end <= offset) return tokens[index];
  }
  return undefined;
}

export function findMatchingOpen(
  tokens: readonly SourceToken[],
  closeText: string,
  openText: string,
  offset: number,
): SourceToken | undefined {
  let depth = 0;
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index]!;
    if (token.start >= offset) continue;
    if (token.text === closeText) depth += 1;
    if (token.text === openText) {
      if (depth === 0) return token;
      depth -= 1;
    }
  }
  return undefined;
}

export function hasTokenBetween(
  tokens: readonly SourceToken[],
  start: number,
  end: number,
  values: readonly string[],
): boolean {
  const set = new Set(values);
  return tokens.some(
    (token) =>
      token.start >= start && token.end <= end && set.has(token.normalized),
  );
}
