"use client";

import type { ReactNode } from "react";
import { useState } from "react";

const PSEUDOCODE_KEYWORDS = new Set([
  "CLASS",
  "BEGIN",
  "END",
  "IF",
  "THEN",
  "ELSE",
  "FOR",
  "TO",
  "DO",
  "WHILE",
  "REPEAT",
  "UNTIL",
  "RETURN",
  "CALL",
  "PRINT",
  "AND",
  "OR",
  "NOT",
  "DIV",
  "MOD",
  "TRUE",
  "FALSE",
  "NULL",
  "LENGTH",
]);

function renderPseudocodeLine(line: string, lineIndex: number) {
  const tokens: ReactNode[] = [];
  const tokenPattern =
    /"(?:\\.|[^"\\])*"|[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|<-|:=|==|!=|<>|<=|>=|[+\-*/=<>(),;.]|\[|\]|\{|\}/gi;
  let cursor = 0;

  let match = tokenPattern.exec(line);
  while (match) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > cursor) {
      tokens.push(
        <span key={`${lineIndex}-${cursor}`} className="text-white">
          {line.slice(cursor, start)}
        </span>,
      );
    }

    const normalizedToken = token.normalize("NFKC").toUpperCase();
    const isKeyword = PSEUDOCODE_KEYWORDS.has(normalizedToken);
    const isGrammar =
      isKeyword ||
      (!/^"/.test(token) &&
        !/^\d/.test(token) &&
        /^[.:;<>=()[\]{},;+\-*/]+$/.test(token));

    tokens.push(
      <span
        key={`${lineIndex}-${start}`}
        className={isGrammar ? "font-semibold text-cyan-300" : "text-white"}
      >
        {token}
      </span>,
    );
    cursor = start + token.length;
    match = tokenPattern.exec(line);
  }

  if (cursor < line.length) {
    tokens.push(
      <span key={`${lineIndex}-${cursor}`} className="text-white">
        {line.slice(cursor)}
      </span>,
    );
  }

  return tokens;
}

function renderPseudocodeExample(example: string) {
  return example
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line, index) => (
      <div
        key={`example-line-${index}`}
        className="flex min-w-max whitespace-pre"
      >
        <span
          aria-hidden="true"
          className="mr-4 inline-block w-4 shrink-0 select-none text-right text-slate-600"
        >
          {index + 1}
        </span>
        <span>{renderPseudocodeLine(line, index)}</span>
      </div>
    ));
}

interface CodeConceptCardProps {
  readonly title: string;
  readonly description: ReactNode;
  readonly example: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly actionOptions?: readonly {
    readonly label: string;
    readonly onAction: () => void;
    readonly preview?: string;
  }[];
  readonly disabled?: boolean;
}

export function CodeConceptCard({
  title,
  description,
  example,
  actionLabel,
  onAction,
  actionOptions,
  disabled = false,
}: Readonly<CodeConceptCardProps>) {
  const [hoveredActionIndex, setHoveredActionIndex] = useState<number | null>(
    null,
  );
  const hoveredPreview =
    hoveredActionIndex !== null
      ? actionOptions?.[hoveredActionIndex]?.preview
      : undefined;
  const visibleExample = hoveredPreview ?? example;

  return (
    <div className="manual-tutorial-step-card w-full text-center">
      <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">
        {description}
      </p>
      <div
        className={`manual-guidance-monaco relative mx-auto mt-5 ${
          actionOptions && actionOptions.length > 4
            ? "h-[180px]"
            : "h-[150px]"
        } w-full max-w-md select-none overflow-hidden rounded-xl border border-white/10 bg-[#0F151B] shadow-none`}
      >
        <pre className="h-full overflow-auto p-4 font-mono text-white [tab-size:4]">
          <code>{renderPseudocodeExample(visibleExample)}</code>
        </pre>
        <div
          aria-hidden="true"
          className="pointer-events-auto absolute inset-0 z-[5] cursor-default bg-transparent"
        />
        {actionOptions && actionOptions.length > 0 ? (
          <div className="absolute right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-col items-end gap-1">
            {actionOptions.map((option, index) => (
              <button
                key={option.label}
                type="button"
                onClick={option.onAction}
                onMouseDown={(event) => event.preventDefault()}
                onPointerEnter={() => setHoveredActionIndex(index)}
                onPointerLeave={() => setHoveredActionIndex(null)}
                onMouseEnter={() => setHoveredActionIndex(index)}
                onMouseLeave={() => setHoveredActionIndex(null)}
                onFocus={() => setHoveredActionIndex(index)}
                onBlur={() => setHoveredActionIndex(null)}
                disabled={disabled}
                aria-pressed={hoveredActionIndex === index}
                style={
                  hoveredActionIndex === index
                    ? {
                        borderColor: "rgba(103, 232, 249, 0.5)",
                        backgroundColor: "rgba(103, 232, 249, 0.25)",
                        color: "rgb(207, 250, 254)",
                        boxShadow: "0 0 12px rgba(34, 211, 238, 0.16)",
                      }
                    : undefined
                }
                className={`inline-flex h-7 items-center justify-center rounded-full border px-2 text-[10px] font-semibold transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none ${
                  hoveredActionIndex === index
                    ? "border-cyan-300/50 bg-cyan-300/25 text-cyan-100"
                    : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200/70 hover:bg-cyan-400/20 hover:text-cyan-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : actionLabel && onAction ? (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-transparent p-0.5">
            <button
              type="button"
              onClick={onAction}
              disabled={disabled}
              aria-label={actionLabel}
              title={actionLabel}
              className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 text-[11px] font-semibold text-cyan-200/60 opacity-70 transition-all duration-300 ease-out hover:bg-cyan-400/20 hover:text-cyan-100 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
            >
              <span
                className="material-symbols-outlined text-[15px]"
                aria-hidden="true"
              >
                add
              </span>
              <span>{actionLabel}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
