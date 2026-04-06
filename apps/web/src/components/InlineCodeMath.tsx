"use client";

import React, { useMemo } from "react";

type InlineCodeMathProps = {
  value: string;
  className?: string;
  asCode?: boolean;
};

const COMMAND_MAP: Record<string, string> = {
  Theta: "Θ",
  Omega: "Ω",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  lambda: "λ",
  mu: "μ",
  pi: "π",
  sigma: "σ",
  cdot: "·",
  times: "×",
  leq: "≤",
  geq: "≥",
  neq: "≠",
  infty: "∞",
  sum: "∑",
  prod: "∏",
  log: "log",
  left: "",
  right: "",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseBalancedGroup(
  input: string,
  start: number,
): { value: string; next: number } {
  if (input[start] !== "{") {
    return { value: "", next: start };
  }

  let depth = 1;
  let index = start + 1;
  while (index < input.length && depth > 0) {
    if (input[index] === "{") depth += 1;
    else if (input[index] === "}") depth -= 1;
    index += 1;
  }

  return {
    value: input.slice(start + 1, Math.max(start + 1, index - 1)),
    next: index,
  };
}

function parseCodeMathToHtml(input: string): string {
  const parts: string[] = [];
  let index = 0;

  const parseAtom = (start: number): { html: string; next: number } => {
    const current = input[start];
    if (current == null) {
      return { html: "", next: start };
    }

    if (current === "{") {
      const group = parseBalancedGroup(input, start);
      return { html: parseCodeMathToHtml(group.value), next: group.next };
    }

    if (current === "\\") {
      let end = start + 1;
      while (end < input.length && /[A-Za-z]/.test(input[end] ?? "")) {
        end += 1;
      }
      const command = input.slice(start + 1, end);

      if (command === "frac") {
        const numerator =
          input[end] === "{"
            ? parseBalancedGroup(input, end)
            : { value: input[end] ?? "", next: end + 1 };
        const denominator =
          input[numerator.next] === "{"
            ? parseBalancedGroup(input, numerator.next)
            : { value: input[numerator.next] ?? "", next: numerator.next + 1 };

        return {
          html: `(${parseCodeMathToHtml(numerator.value)})/(${parseCodeMathToHtml(denominator.value)})`,
          next: denominator.next,
        };
      }

      if (command === "text") {
        const group =
          input[end] === "{"
            ? parseBalancedGroup(input, end)
            : { value: "", next: end };
        return {
          html: escapeHtml(group.value),
          next: group.next,
        };
      }

      if (!command) {
        const escapedNext = input[start + 1];
        return {
          html: escapeHtml(escapedNext ?? "\\"),
          next: escapedNext == null ? start + 1 : start + 2,
        };
      }

      return {
        html: escapeHtml(COMMAND_MAP[command] ?? command),
        next: end,
      };
    }

    return { html: escapeHtml(current), next: start + 1 };
  };

  const parseScript = (start: number): { html: string; next: number } => {
    if (input[start] === "{") {
      const group = parseBalancedGroup(input, start);
      return { html: parseCodeMathToHtml(group.value), next: group.next };
    }
    return parseAtom(start);
  };

  while (index < input.length) {
    const current = input[index];

    if ((current === "^" || current === "_") && index + 1 <= input.length) {
      const script = parseScript(index + 1);
      const tag = current === "^" ? "sup" : "sub";
      const klass =
        current === "^" ? "inline-code-math-sup" : "inline-code-math-sub";
      const base = parts.pop() ?? "";
      parts.push(
        `<span class="inline-code-math-cluster">${base}<${tag} class="${klass}">${script.html}</${tag}></span>`,
      );
      index = script.next;
      continue;
    }

    const atom = parseAtom(index);
    parts.push(atom.html);
    index = atom.next;
  }

  return parts.join("");
}

function normalizeInlineCodeMath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
    return trimmed.slice(2, -2).trim();
  }
  if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length > 2) {
    return trimmed.slice(1, -1).trim();
  }
  if (trimmed.startsWith("\\(") && trimmed.endsWith("\\)") && trimmed.length > 4) {
    return trimmed.slice(2, -2).trim();
  }
  if (trimmed.startsWith("\\[") && trimmed.endsWith("\\]") && trimmed.length > 4) {
    return trimmed.slice(2, -2).trim();
  }

  return trimmed;
}

export default function InlineCodeMath({
  value,
  className,
  asCode = false,
}: Readonly<InlineCodeMathProps>) {
  const html = useMemo(
    () => parseCodeMathToHtml(normalizeInlineCodeMath(value)),
    [value],
  );
  const Tag = asCode ? "code" : "span";
  const rootClassName = [
    asCode ? "inline-code-math-chip" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={rootClassName}>
      <span
        className="inline-code-math"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Tag>
  );
}
