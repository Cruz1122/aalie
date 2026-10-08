"use client";

import type { RenderableContent as RenderableContentType } from "@aa/types";
import type { ReactNode } from "react";

import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Props {
  content: RenderableContentType;
  className?: string;
}

function resolveBlockLanguage(block: unknown): string | null {
  if (
    block &&
    typeof block === "object" &&
    "language" in block &&
    typeof (block as { language?: unknown }).language === "string"
  ) {
    return (block as { language: string }).language;
  }
  return null;
}

function normalizeAaliePseudocodeIndentation(source: string): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const INDENT = "  ";
  let depth = 0;

  return lines
    .map((rawLine) => {
      const line = rawLine.trim();
      if (!line) return "";

      const upper = line.toUpperCase();
      const startsClosingBlock = upper.startsWith("END");
      if (startsClosingBlock) {
        depth = Math.max(0, depth - 1);
      }

      const indentedLine = `${INDENT.repeat(depth)}${line}`;
      const opensBlock = /\bBEGIN\b/.test(upper) && !startsClosingBlock;
      if (opensBlock) {
        depth += 1;
      }

      return indentedLine;
    })
    .join("\n");
}

function renderAaliePseudocodeHighlighted(source: string): ReactNode[] {
  const keywordRe =
    /\b(CLASS|BEGIN|END|IF|THEN|ELSE|WHILE|FOR|TO|DO|REPEAT|UNTIL|RETURN|CALL|PRINT|MOD|DIV|AND|OR|NOT|TRUE|FALSE|NULL|LENGTH)\b/gi;
  const numberRe = /\b\d+(\.\d+)?\b/g;
  const stringRe = /"([^"\\]|\\.)*"/g;

  const tokenize = (text: string, lineKey: string): ReactNode[] => {
    const tokens: Array<{
      kind: "keyword" | "number" | "string" | "plain";
      value: string;
    }> = [];
    const patterns = [
      { kind: "string" as const, re: stringRe },
      { kind: "keyword" as const, re: keywordRe },
      { kind: "number" as const, re: numberRe },
    ];

    let i = 0;
    while (i < text.length) {
      let best:
        | {
            kind: (typeof patterns)[number]["kind"];
            start: number;
            end: number;
            value: string;
          }
        | undefined;

      for (const pattern of patterns) {
        pattern.re.lastIndex = i;
        const match = pattern.re.exec(text);
        if (!match) continue;
        const start = match.index;
        const end = start + match[0].length;
        if (start < i) continue;
        if (!best || start < best.start) {
          best = { kind: pattern.kind, start, end, value: match[0] };
        }
      }

      if (!best) {
        tokens.push({ kind: "plain", value: text.slice(i) });
        break;
      }

      if (best.start > i) {
        tokens.push({ kind: "plain", value: text.slice(i, best.start) });
      }
      tokens.push({ kind: best.kind, value: best.value });
      i = best.end;
    }

    return tokens.map((token, idx) => {
      const key = `${lineKey}_t${idx}`;
      switch (token.kind) {
        case "keyword":
          return (
            <span key={key} className="font-semibold text-cyan-300">
              {token.value}
            </span>
          );
        case "string":
          return (
            <span key={key} className="text-white">
              {token.value}
            </span>
          );
        case "number":
          return (
            <span key={key} className="text-white">
              {token.value}
            </span>
          );
        default:
          return <span key={key}>{token.value}</span>;
      }
    });
  };

  return source.split("\n").map((line, lineIdx) => {
    const lineKey = `l${lineIdx}`;
    const commentStart = line.indexOf("//");
    const beforeComment =
      commentStart >= 0 ? line.slice(0, commentStart) : line;
    const comment = commentStart >= 0 ? line.slice(commentStart) : "";

    return (
      <div key={lineKey} className="whitespace-pre">
        {tokenize(beforeComment, lineKey)}
        {comment ? <span className="text-slate-400/70">{comment}</span> : null}
      </div>
    );
  });
}

export default function RenderableContent({ content, className }: Props) {
  return (
    <div className={className}>
      {content.blocks.map((block, index) => {
        const blockSpacingClass =
          index < content.blocks.length - 1 ? "mb-2" : "mb-0";
        if (block.type === "code") {
          const language = resolveBlockLanguage(block);
          const isAaliePseudocode = language === "aalie-pseudocode";
          const normalizedCode = isAaliePseudocode
            ? normalizeAaliePseudocodeIndentation(block.content)
            : block.content;
          const renderedCode = isAaliePseudocode
            ? renderAaliePseudocodeHighlighted(normalizedCode)
            : normalizedCode;

          return (
            <pre
              key={index}
              className={`${blockSpacingClass} overflow-x-auto whitespace-pre rounded border border-cyan-500/20 bg-slate-900/80 p-3 font-mono text-[11px] leading-relaxed text-white [tab-size:4]`}
            >
              <code className="block whitespace-pre">{renderedCode}</code>
            </pre>
          );
        }
        return (
          <MarkdownRenderer
            key={index}
            content={block.content}
            className={blockSpacingClass}
          />
        );
      })}
    </div>
  );
}
