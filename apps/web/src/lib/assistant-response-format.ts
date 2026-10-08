const MARKDOWN_FENCE_RE = /```|~~~/;
const PSEUDOCODE_SIGNATURE_RE =
  /[A-Za-z_][A-Za-z0-9_]*\s*\([^()\n]*\)\s+BEGIN\b/i;
const BLOCK_TOKEN_RE = /\b(BEGIN|END)\b/gi;

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

  const tokens = new RegExp(BLOCK_TOKEN_RE.source, "gi");
  tokens.lastIndex = codeStart + firstBegin;

  let depth = 0;
  let codeEnd = -1;
  let token: RegExpExecArray | null;

  while ((token = tokens.exec(content)) !== null) {
    if (token[1].toUpperCase() === "BEGIN") {
      depth += 1;
    } else if (depth > 0) {
      depth -= 1;
    }

    if (depth === 0) {
      codeEnd = tokens.lastIndex;
      break;
    }
  }

  if (codeEnd <= codeStart) return null;

  return {
    prefix: content.slice(0, codeStart).trim(),
    code: content.slice(codeStart, codeEnd).trim(),
    suffix: content.slice(codeEnd).trim(),
  };
}

/**
 * Restores Markdown code fencing when a provider returns valid project
 * pseudocode as plain text instead of a fenced block.
 */
export function normalizeAssistantMarkdown(content: string): string {
  const trimmed = content.trim();
  if (!trimmed || MARKDOWN_FENCE_RE.test(trimmed)) return trimmed;

  const segment = findPseudocodeSegment(trimmed);
  if (!segment) return trimmed;

  const fencedCode = `\`\`\`pseudocode\n${segment.code}\n\`\`\``;
  return [segment.prefix, fencedCode, segment.suffix]
    .filter(Boolean)
    .join("\n\n");
}
