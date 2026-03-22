const MATH_COMMAND_PATTERN = /\\[A-Za-z]+/;
const BASIC_MATH_OPERATOR_PATTERN = /[=+*^]/;
const FRACTION_PATTERN = /[A-Za-z]\s*\/\s*\d/;
const SUBTRACTION_PATTERN = /[A-Za-z]\s*-\s*\d/;
const SPECIAL_TEXT_PATTERN = /[&%$#{}~]/;

export function isLikelyMathExpression(value: string): boolean {
  if (!value) return false;
  if (MATH_COMMAND_PATTERN.test(value)) return true;
  if (/^(O|Omega|Theta)\s*\(/.test(value)) return true;
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
