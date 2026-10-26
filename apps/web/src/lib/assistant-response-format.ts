const MARKDOWN_FENCE_RE = /```|~~~/;
const PSEUDOCODE_FENCE_RE =
  /(^|\n)([ \t]*(```|~~~)pseudocode[^\n]*\n)([\s\S]*?)(\n[ \t]*\3)/gi;
const PSEUDOCODE_SIGNATURE_RE =
  /[A-Za-z_][A-Za-z0-9_]*\s*\([^()\n]*\)\s+BEGIN\b/i;
type PseudocodeToken =
  | { kind: "text" | "comment"; value: string }
  | { kind: "begin" | "end" | "semicolon" | "newline"; value: string };

interface PseudocodeSegment {
  prefix: string;
  code: string;
  suffix: string;
}

function findPseudocodeSegment(content: string): PseudocodeSegment | null {
  const signature = PSEUDOCODE_SIGNATURE_RE.exec(content);
  if (!signature || signature.index == null) return null;

  const codeStart = signature.index;
  const firstBegin = content.slice(codeStart).search(/\bBEGIN\b/i);
  if (firstBegin < 0) return null;

  let depth = 0;
  let codeEnd = -1;
  let index = codeStart;

  while (index < content.length) {
    const char = content[index];

    if (char === '"' || char === "'") {
      const quote = char;
      index += 1;

      while (index < content.length) {
        if (content[index] === "\\") {
          index += 2;
        } else if (content[index] === quote) {
          index += 1;
          break;
        } else {
          index += 1;
        }
      }
      continue;
    }

    if (char === "►" || (char === "/" && content[index + 1] === "/")) {
      const newlineIndex = content.indexOf("\n", index);
      if (newlineIndex < 0) break;
      index = newlineIndex + 1;
      continue;
    }

    const previousChar = content[index - 1];
    if (
      /[BE]/i.test(char) &&
      (!previousChar || !/[A-Za-z0-9_]/.test(previousChar))
    ) {
      const blockToken = /^(BEGIN|END)\b/i.exec(content.slice(index));
      if (blockToken) {
        if (blockToken[1].toUpperCase() === "BEGIN") {
          depth += 1;
        } else if (depth > 0) {
          depth -= 1;
        }

        if (depth === 0) {
          codeEnd = index + blockToken[0].length;
          break;
        }

        index += blockToken[0].length;
        continue;
      }
    }

    index += 1;
  }

  if (codeEnd <= codeStart) return null;

  return {
    prefix: content.slice(0, codeStart).trim(),
    code: content.slice(codeStart, codeEnd).trim(),
    suffix: content.slice(codeEnd).trim(),
  };
}

function hasPseudocodeIndentation(code: string): boolean {
  return code.split(/\r?\n/).some((line) => /^(?: {2,}|\t)\S/.test(line));
}

function tokenizePseudocode(code: string): PseudocodeToken[] {
  const tokens: PseudocodeToken[] = [];
  let text = "";

  const pushText = () => {
    if (text) tokens.push({ kind: "text", value: text });
    text = "";
  };

  for (let index = 0; index < code.length; ) {
    const char = code[index];

    if (char === '"' || char === "'") {
      const quote = char;
      text += char;
      index += 1;

      while (index < code.length) {
        const current = code[index];
        text += current;
        index += 1;

        if (current === "\\" && index < code.length) {
          text += code[index];
          index += 1;
        } else if (current === quote) {
          break;
        }
      }
      continue;
    }

    if (char === "►" || (char === "/" && code[index + 1] === "/")) {
      pushText();
      const newlineIndex = code.indexOf("\n", index);
      const end = newlineIndex < 0 ? code.length : newlineIndex;
      tokens.push({ kind: "comment", value: code.slice(index, end).trimEnd() });
      index = end;
      continue;
    }

    if (char === "\n") {
      pushText();
      tokens.push({ kind: "newline", value: "\n" });
      index += 1;
      continue;
    }

    if (char === ";") {
      pushText();
      tokens.push({ kind: "semicolon", value: ";" });
      index += 1;
      continue;
    }

    const blockToken = /^(BEGIN|END)\b/i.exec(code.slice(index));
    if (blockToken) {
      pushText();
      tokens.push({
        kind: blockToken[1].toUpperCase() === "BEGIN" ? "begin" : "end",
        value: blockToken[1].toUpperCase(),
      });
      index += blockToken[0].length;
      continue;
    }

    text += char;
    index += 1;
  }

  pushText();
  return tokens;
}

function hasMultipleStatementsOnLine(code: string): boolean {
  let semicolonSeenOnLine = false;

  for (const token of tokenizePseudocode(code)) {
    if (token.kind === "newline") {
      semicolonSeenOnLine = false;
    } else if (token.kind === "comment") {
      continue;
    } else if (token.kind === "semicolon") {
      if (semicolonSeenOnLine) return true;
      semicolonSeenOnLine = true;
    } else if (semicolonSeenOnLine && token.value.trim()) {
      return true;
    }
  }

  return false;
}

/** Formats flat pseudocode while leaving already-indented assistant output intact. */
function restorePseudocodeIndentation(code: string): string {
  const trimmed = code.trim();
  if (
    !trimmed ||
    (hasPseudocodeIndentation(trimmed) &&
      !hasMultipleStatementsOnLine(trimmed)) ||
    !/\bBEGIN\b/i.test(trimmed) ||
    !/\bEND\b/i.test(trimmed)
  ) {
    return trimmed;
  }

  const lines: string[] = [];
  let line = "";
  let depth = 0;
  const indent = () => "    ".repeat(Math.max(0, depth));

  const flushLine = (suffix = "") => {
    const value = line.trim();
    if (value) lines.push(`${indent()}${value}${suffix}`);
    line = "";
  };

  for (const token of tokenizePseudocode(trimmed)) {
    switch (token.kind) {
      case "text":
        line += token.value;
        break;
      case "semicolon":
        flushLine(";");
        break;
      case "begin": {
        const header = line.trim();
        lines.push(`${indent()}${header ? `${header} ` : ""}BEGIN`);
        line = "";
        depth += 1;
        break;
      }
      case "end":
        flushLine();
        depth = Math.max(0, depth - 1);
        lines.push(`${indent()}END`);
        break;
      case "comment":
        line += `${line.trim() ? " " : ""}${token.value}`;
        flushLine();
        break;
      case "newline":
        flushLine();
        break;
    }
  }

  flushLine();
  return lines.join("\n");
}

function normalizeFencedPseudocode(content: string): string {
  return content.replace(
    PSEUDOCODE_FENCE_RE,
    (
      _match,
      prefix: string,
      openingFence: string,
      _fenceMarker: string,
      code: string,
      closingFence: string,
    ) =>
      `${prefix}${openingFence}${restorePseudocodeIndentation(code)}${closingFence}`,
  );
}

/**
 * Restores Markdown code fencing and indentation when a provider returns
 * valid project pseudocode as plain or flat text.
 */
export function normalizeAssistantMarkdown(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return trimmed;

  if (MARKDOWN_FENCE_RE.test(trimmed)) {
    return normalizeFencedPseudocode(trimmed);
  }

  const segment = findPseudocodeSegment(trimmed);
  if (!segment) return trimmed;

  const fencedCode = `\`\`\`pseudocode\n${restorePseudocodeIndentation(segment.code)}\n\`\`\``;
  return [segment.prefix, fencedCode, segment.suffix]
    .filter(Boolean)
    .join("\n\n");
}
