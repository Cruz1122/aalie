const MATH_COMMAND_PATTERN = /\\[A-Za-z]+/;
const BASIC_MATH_OPERATOR_PATTERN = /[=+*^]/;
const FRACTION_PATTERN = /\b[A-Za-z]\b\s*\/\s*\d/;
const SUBTRACTION_PATTERN = /\b[A-Za-z]\b\s*-\s*\d/;
const SPECIAL_TEXT_PATTERN = /[&%$#{}~]/;

function isNarrativeSentence(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  if (!normalized.includes(" ")) return false;
  if (normalized.includes("\\")) return false;
  if (normalized.includes("=")) return false;
  if (/^(O|Omega|Theta)\s*\(/.test(normalized)) return false;
  if (/[A-Za-z]_\{[^}]+\}/.test(normalized)) return false;
  if (/C_\d+/.test(normalized)) return false;

  const narrativeWords = normalized.match(/[A-Za-zÀ-ÿ]{3,}/g) ?? [];
  return narrativeWords.length >= 3;
}

function isNarrativeEquation(value: string): boolean {
  const normalized = value.trim();
  if (!normalized.includes("=")) return false;
  if (normalized.includes("\\")) return false;
  if (/[{}_^]/.test(normalized)) return false;
  if (/^T\(n\)\s*=/.test(normalized)) return false;
  if (/^[A-Za-z](?:_[0-9{}]+)?\s*=/.test(normalized)) return false;
  return /[A-Za-zÀ-ÿ]{3,}/.test(normalized);
}

export function isLikelyMathExpression(value: string): boolean {
  if (!value) return false;
  if (isNarrativeSentence(value)) return false;
  if (isNarrativeEquation(value)) return false;
  if (MATH_COMMAND_PATTERN.test(value)) return true;
  if (/^(O|Omega|Theta)\s*\(/.test(value)) return true;
  if (/[A-Za-z]_\{[^}]+\}/.test(value)) return true;
  if (/C_\d+/.test(value)) return true;
  if (BASIC_MATH_OPERATOR_PATTERN.test(value)) return true;
  if (FRACTION_PATTERN.test(value)) return true;
  if (SUBTRACTION_PATTERN.test(value)) return true;
  return false;
}

export function isTechnicalToken(value: string): boolean {
  if (!value) return false;
  if (value.includes(" ")) return false;
  if (!value.includes("_")) return false;
  if (SPECIAL_TEXT_PATTERN.test(value)) return false;
  if (MATH_COMMAND_PATTERN.test(value)) return false;
  if (BASIC_MATH_OPERATOR_PATTERN.test(value)) return false;
  if (FRACTION_PATTERN.test(value)) return false;
  if (SUBTRACTION_PATTERN.test(value)) return false;
  return true;
}

export function toMarkdownInlineMath(value: string): string {
  const normalized = value.trim();
  if (!normalized) return normalized;
  if (!isLikelyMathExpression(normalized)) return normalized;
  if (/^\$.*\$$/.test(normalized)) return normalized;
  return `$${normalized}$`;
}

export function toMarkdownTextWithInlineMath(text: string): string {
  const normalized = text.trim();
  if (!normalized) return text;
  // If text already contains inline/block math delimiters, keep as-is to avoid
  // wrapping full narrative paragraphs inside a single math expression.
  if (normalized.includes("$")) return text;
  // Preserve multi-line pedagogical text; wrapping the whole block as math
  // causes malformed markdown in rendered reports.
  if (normalized.includes("\n")) return text;
  if (normalized.includes(";")) return text;

  const separatorIndex = normalized.indexOf(":");
  if (separatorIndex > -1) {
    const left = normalized.slice(0, separatorIndex + 1);
    const right = normalized.slice(separatorIndex + 1).trim();
    if (!/[;,]/.test(right) && isLikelyMathExpression(right)) {
      return `${left} ${toMarkdownInlineMath(right)}`;
    }
  }

  if (isLikelyMathExpression(normalized)) {
    return toMarkdownInlineMath(normalized);
  }

  return text;
}
