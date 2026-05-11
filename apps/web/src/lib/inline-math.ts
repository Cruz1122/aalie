export type InlineCodeMathMode = "auto" | "inline" | "hybrid";
export type InlineMarkdownMathMode = "auto" | "latex" | "hybrid";

export function normalizeInlineMathValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (
    trimmed.startsWith("$$") &&
    trimmed.endsWith("$$") &&
    trimmed.length > 4
  ) {
    return trimmed.slice(2, -2).trim();
  }
  if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length > 2) {
    return trimmed.slice(1, -1).trim();
  }
  if (
    trimmed.startsWith("\\(") &&
    trimmed.endsWith("\\)") &&
    trimmed.length > 4
  ) {
    return trimmed.slice(2, -2).trim();
  }
  if (
    trimmed.startsWith("\\[") &&
    trimmed.endsWith("\\]") &&
    trimmed.length > 4
  ) {
    return trimmed.slice(2, -2).trim();
  }

  return trimmed;
}

function looksLikeInlineMath(value: string): boolean {
  if (
    /\\[A-Za-z]+/.test(value) ||
    /\\[{}[\]^_]/.test(value) ||
    /[A-Za-z0-9)\]]\^\{[^}]+\}/.test(value) ||
    /[A-Za-z0-9)\]]_\{[^}]+\}/.test(value) ||
    /(frac|sqrt|sum|prod|Theta|Omega|alpha|beta|gamma|delta|lambda|log)/.test(
      value,
    )
  ) {
    return true;
  }

  const hasSimpleScript =
    /(^|[^A-Za-z0-9_])(?:[A-Za-z0-9)\]](?:_(?:\{[^}]+\}|[A-Za-z0-9+\-]+)|\^(?:\{[^}]+\}|[A-Za-z0-9+\-]+)))(?=[^A-Za-z0-9_]|$)/.test(
      value,
    );

  if (hasSimpleScript) {
    return true;
  }

  const hasMathExpressionWithScripts =
    /[=+\-*/()]/.test(value) &&
    /(?:[A-Za-z0-9)\]](?:_(?:\{[^}]+\}|[A-Za-z0-9+\-]+)|\^(?:\{[^}]+\}|[A-Za-z0-9+\-]+)))/.test(
      value,
    );

  return hasMathExpressionWithScripts;
}

export function normalizeInlineMathCandidate(raw: string): string | null {
  const normalized = normalizeInlineMathValue(raw);
  if (!normalized) {
    return null;
  }

  return looksLikeInlineMath(normalized) ? normalized : null;
}

function isHybridFriendlyInlineMath(value: string): boolean {
  const normalized = normalizeInlineMathValue(value);
  if (!normalized) {
    return false;
  }

  if (!normalizeInlineMathCandidate(normalized)) {
    return false;
  }

  if (
    normalized.length > 24 ||
    /\s/.test(normalized) ||
    /[=<>≤≥]/.test(normalized) ||
    /\\(frac|sqrt|sum|prod|int|begin|end|text|left|right|overline|underline)/.test(
      normalized,
    )
  ) {
    return false;
  }

  return true;
}

export function resolveInlineCodeMathMode(
  raw: string,
  mode: InlineCodeMathMode = "auto",
): { normalized: string | null; renderAs: "inline" | "hybrid" } {
  const normalized = normalizeInlineMathCandidate(raw);
  if (!normalized) {
    return { normalized: null, renderAs: "inline" };
  }

  if (mode === "hybrid") {
    return { normalized, renderAs: "hybrid" };
  }

  if (mode === "inline") {
    return { normalized, renderAs: "inline" };
  }

  return {
    normalized,
    renderAs: isHybridFriendlyInlineMath(normalized) ? "hybrid" : "inline",
  };
}

export function resolveInlineMarkdownMathMode(
  raw: string,
  mode: InlineMarkdownMathMode = "auto",
): { normalized: string; renderAs: "latex" | "hybrid" } {
  const normalized = normalizeInlineMathValue(raw);

  if (mode === "hybrid") {
    return { normalized, renderAs: "hybrid" };
  }

  if (mode === "latex") {
    return { normalized, renderAs: "latex" };
  }

  return {
    normalized,
    renderAs: isHybridFriendlyInlineMath(normalized) ? "hybrid" : "latex",
  };
}
