import {
  findMatchingOpen,
  tokenizeSource,
  type SourceToken,
} from "./sourceTokens";
import type { EditorLocation } from "./types";

export interface PartialSyntaxContext {
  readonly primary: EditorLocation;
  readonly insideProcedure: boolean;
  readonly insideParameters: boolean;
  readonly insideBlock: boolean;
  readonly insideCondition: boolean;
  readonly insideExpression: boolean;
  readonly insideLoop: boolean;
  readonly insideConditional: boolean;
  readonly procedureName?: string;
}

function isProcedureSignature(
  tokens: readonly SourceToken[],
  openParen: SourceToken,
): boolean {
  const index = tokens.findIndex((token) => token.start === openParen.start);
  const name = index > 0 ? tokens[index - 1] : undefined;
  if (!name || name.kind !== "identifier") return false;

  const previous = index > 1 ? tokens[index - 2] : undefined;
  if (
    previous &&
    ["if", "while", "for", "call", "print", "length", "return"].includes(
      previous.normalized,
    )
  ) {
    return false;
  }

  const beforeName = tokens.slice(0, Math.max(0, index - 1));
  const lastStatementBoundary = Math.max(
    -1,
    ...beforeName.map((token, tokenIndex) =>
      [";", "begin", "end", "}"].includes(token.normalized) ? tokenIndex : -1,
    ),
  );
  return !beforeName
    .slice(lastStatementBoundary + 1)
    .some((token) =>
      ["<-", ":=", "if", "while", "for", "call", "return"].includes(
        token.normalized,
      ),
    );
}

function findProcedureName(
  tokens: readonly SourceToken[],
  cursorOffset: number,
): string | undefined {
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const token = tokens[index]!;
    const next = tokens[index + 1]!;
    if (token.kind !== "identifier" || next.text !== "(") continue;
    if (!isProcedureSignature(tokens, next)) continue;

    let depth = 0;
    for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
      const current = tokens[cursor]!;
      if (current.text === "(") depth += 1;
      if (current.text === ")") depth -= 1;
      if (depth === 0) {
        const after = tokens[cursor + 1];
        const beginsProcedure =
          after?.normalized === "begin" || after?.text === "{";
        if (!beginsProcedure) break;
        if (cursorOffset <= after.start) return token.text;

        let bodyDepth = 0;
        for (
          let bodyCursor = cursor + 1;
          bodyCursor < tokens.length;
          bodyCursor += 1
        ) {
          const bodyToken = tokens[bodyCursor]!;
          if (bodyToken.start >= cursorOffset) break;
          if (bodyToken.normalized === "begin" || bodyToken.text === "{") {
            bodyDepth += 1;
          }
          if (bodyToken.normalized === "end" || bodyToken.text === "}") {
            bodyDepth -= 1;
          }
          if (bodyDepth <= 0) return undefined;
        }
        if (bodyDepth > 0) return token.text;
        break;
      }
    }
  }
  return undefined;
}

function hasProcedureStarted(
  tokens: readonly SourceToken[],
  cursorOffset: number,
): boolean {
  const procedureName = findProcedureName(tokens, cursorOffset);
  if (procedureName) return true;

  let lastBegin = -1;
  let lastEnd = -1;
  for (const token of tokens) {
    if (token.start >= cursorOffset) break;
    if (token.normalized === "begin" || token.text === "{")
      lastBegin = token.start;
    if (token.normalized === "end" || token.text === "}") lastEnd = token.start;
  }
  return (
    lastBegin > lastEnd &&
    tokens.some(
      (token, index) =>
        token.start < lastBegin &&
        token.kind === "identifier" &&
        tokens[index + 1]?.text === "(",
    )
  );
}

function isInsideOpenParenthesis(
  tokens: readonly SourceToken[],
  cursorOffset: number,
): SourceToken | undefined {
  const open = findMatchingOpen(tokens, ")", "(", cursorOffset);
  if (!open) return undefined;
  const afterOpen = tokens.filter(
    (token) => token.start > open.end && token.start < cursorOffset,
  );
  const closeBeforeCursor = afterOpen.some((token) => token.text === ")");
  return closeBeforeCursor ? undefined : open;
}

function previousKeyword(
  tokens: readonly SourceToken[],
  openParen: SourceToken,
): string | undefined {
  const before = tokens.filter((token) => token.end <= openParen.start);
  for (let index = before.length - 1; index >= 0; index -= 1) {
    const token = before[index]!;
    if (
      [
        "if",
        "while",
        "for",
        "repeat",
        "until",
        "return",
        "begin",
        "end",
        ";",
      ].includes(token.normalized)
    ) {
      return token.normalized;
    }
  }
  return undefined;
}

function determineBlockFlags(
  tokens: readonly SourceToken[],
  cursorOffset: number,
): {
  insideBlock: boolean;
  insideLoop: boolean;
  insideConditional: boolean;
} {
  const beforeCursor = tokens.filter((token) => token.start < cursorOffset);
  const stack: Array<"block" | "if" | "loop"> = [];
  let pendingControl: "if" | "loop" | undefined;

  for (const token of beforeCursor) {
    if (token.normalized === "if") pendingControl = "if";
    if (["while", "for", "repeat"].includes(token.normalized))
      pendingControl = "loop";
    if (token.normalized === "begin" || token.text === "{") {
      stack.push(pendingControl ?? "block");
      pendingControl = undefined;
    }
    if (token.normalized === "end" || token.text === "}") stack.pop();
  }

  return {
    insideBlock: stack.length > 0,
    insideLoop: stack.includes("loop"),
    insideConditional: stack.includes("if"),
  };
}

export function resolvePartialSyntaxContext(
  source: string,
  cursorOffset: number,
): PartialSyntaxContext {
  const tokens = tokenizeSource(source, cursorOffset);
  const openParen = isInsideOpenParenthesis(tokens, cursorOffset);
  const procedureName = findProcedureName(tokens, cursorOffset);
  const blockFlags = determineBlockFlags(tokens, cursorOffset);
  const sourceBeforeCursor = source.slice(0, cursorOffset);
  const lastStatement = sourceBeforeCursor.split(/[;\n]/).pop()?.trim() ?? "";
  const lastWord = lastStatement
    .match(/([A-Za-z_][A-Za-z0-9_]*)\s*$/)?.[1]
    ?.toLowerCase();
  const returnExpression =
    /\breturn\b/i.test(lastStatement) && !/\bend\s*$/i.test(lastStatement);
  const assignmentExpression = /(?:<-|:=)\s*[^;]*$/i.test(lastStatement);
  const incompleteFor = /\bfor\s+[A-Za-z_][A-Za-z0-9_]*\s*<-.*$/i.test(
    lastStatement,
  );
  const lastRepeatOffset = sourceBeforeCursor
    .toLowerCase()
    .lastIndexOf("repeat");
  const repeatRegion =
    lastRepeatOffset >= 0
      ? sourceBeforeCursor.slice(lastRepeatOffset)
      : lastStatement;
  const incompleteRepeat = /\brepeat\b.*\buntil\s*\([^)]*$/is.test(
    repeatRegion,
  );
  const loopHeader =
    incompleteFor ||
    incompleteRepeat ||
    /\b(?:while|for|repeat)\b[^;]*\bdo\s*$/i.test(lastStatement);

  let primary: EditorLocation = "UNKNOWN";
  let insideParameters = false;
  let insideCondition = false;
  let insideExpression = false;

  if (source.trim().length === 0) {
    primary = "EMPTY_DOCUMENT";
  } else if (openParen) {
    const keyword = previousKeyword(tokens, openParen);
    if (
      keyword === "if" ||
      keyword === "while" ||
      keyword === "repeat" ||
      keyword === "until"
    ) {
      primary = "CONDITION";
      insideCondition = true;
    } else if (keyword === "return") {
      primary = "RETURN_EXPRESSION";
      insideExpression = true;
    } else if (isProcedureSignature(tokens, openParen)) {
      primary = "PARAMETER_LIST";
      insideParameters = true;
    } else {
      primary = "EXPRESSION";
      insideExpression = true;
    }
  } else if (returnExpression || lastWord === "return") {
    primary = "RETURN_EXPRESSION";
    insideExpression = true;
  } else if (
    insideCondition ||
    /\b(?:if|while|repeat)\s*\([^)]*$/i.test(lastStatement)
  ) {
    primary = "CONDITION";
    insideCondition = true;
  } else if (
    assignmentExpression ||
    /\b(?:and|or|not)\b|[+*/<>=-]/i.test(lastStatement)
  ) {
    primary = "EXPRESSION";
    insideExpression = true;
  } else if (loopHeader && /\bdo\s*$/i.test(lastStatement)) {
    primary = "LOOP_BODY";
  } else if (loopHeader) {
    primary = "EXPRESSION";
    insideExpression = true;
  } else if (procedureName && !blockFlags.insideBlock) {
    primary = "PROCEDURE_SIGNATURE";
  } else if (
    blockFlags.insideBlock &&
    hasProcedureStarted(tokens, cursorOffset)
  ) {
    primary = blockFlags.insideConditional
      ? "IF_BODY"
      : blockFlags.insideLoop
        ? "LOOP_BODY"
        : "PROCEDURE_BODY";
  } else if (source.trim().length > 0) {
    primary = "TOP_LEVEL";
  }

  return {
    primary,
    insideProcedure: Boolean(
      procedureName || hasProcedureStarted(tokens, cursorOffset),
    ),
    insideParameters,
    insideBlock: blockFlags.insideBlock,
    insideCondition,
    insideExpression,
    insideLoop:
      blockFlags.insideLoop ||
      /\b(?:while|for|repeat)\b/i.test(lastStatement) ||
      incompleteFor ||
      incompleteRepeat,
    insideConditional:
      blockFlags.insideConditional || /\bif\b/i.test(lastStatement),
    procedureName,
  };
}
