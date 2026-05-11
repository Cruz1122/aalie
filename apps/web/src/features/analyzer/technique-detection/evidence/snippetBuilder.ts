import type { TechniqueFacts } from "../analysis/collectFacts";
import type { AstNode } from "../ast/astAdapter";
import { getRange } from "../ast/astAdapter";
import type { EvidenceItem } from "../types";

const MAX_LINES = 12;

export function buildCompactSnippet(
  facts: TechniqueFacts,
  items: EvidenceItem[],
  sourceCode?: string,
): string {
  const uniqueNodeIds = [...new Set(items.map((item) => item.nodeId))].slice(
    0,
    8,
  );
  const sourceLines = sourceCode?.split(/\r?\n/);

  const sourceChunks =
    sourceLines == null
      ? []
      : uniqueNodeIds
          .map((id) => facts.index.nodeOf(id))
          .filter(Boolean)
          .map((node) => renderSourceLine(node as AstNode, sourceLines))
          .filter((chunk): chunk is string => Boolean(chunk));

  if (sourceChunks.length > 0) {
    const sourceSnippet = collapseLines(sourceChunks);
    if (sourceSnippet.trim()) {
      return sourceSnippet;
    }
  }

  const chunks = uniqueNodeIds
    .map((id) => facts.index.nodeOf(id))
    .filter(Boolean)
    .map((node) => renderNodeCompact(node as AstNode));

  if (chunks.length === 0) {
    return "AALIE no encontró un fragmento suficientemente claro para mostrar.";
  }

  return collapseLines(chunks);
}

function collapseLines(chunks: string[]): string {
  const lines = chunks.join("\n").split("\n");
  if (lines.length <= MAX_LINES) return lines.join("\n");

  return [
    ...lines.slice(0, MAX_LINES - 2),
    "...",
    lines[lines.length - 1],
  ].join("\n");
}

function renderSourceLine(node: AstNode, sourceLines: string[]): string | null {
  const line = node.pos?.line;
  if (typeof line !== "number" || line < 1 || line > sourceLines.length) {
    return null;
  }

  const rawLine = sourceLines[line - 1]?.trim();
  if (!rawLine || isStructuralDelimiter(rawLine)) {
    return null;
  }

  return rawLine;
}

function isStructuralDelimiter(line: string): boolean {
  return /^(BEGIN|END|ELSE\s+BEGIN|THEN\s+BEGIN)$/i.test(line);
}

function renderNodeCompact(node: AstNode): string {
  const raw = node.sourceText ?? node.text ?? node.raw ?? null;
  if (typeof raw === "string" && raw.trim()) {
    return compactRawText(raw);
  }

  const fallback = renderStructuredFallback(node);
  if (fallback) return fallback;

  const kind = String(node.kind ?? node.type ?? "node");
  const range = getRange(node);
  return range
    ? `<${kind}> líneas ${range.startLine}-${range.endLine}`
    : `<${kind}> ...`;
}

function compactRawText(text: string): string {
  const lines = text.trim().split("\n");
  if (lines.length <= 6) return lines.join("\n");
  return [lines[0], "    ...", lines[lines.length - 1]].join("\n");
}

function renderStructuredFallback(node: AstNode): string | null {
  switch (node.type ?? node.kind) {
    case "Return":
      return `RETURN ${renderExpr(node.value)}`;
    case "Assign":
      return `${renderExpr(node.target)} <- ${renderExpr(node.value)}`;
    case "Call":
      return `${node.callee ?? node.name}(${(node.args ?? [])
        .map((arg) => renderExpr(arg))
        .join(", ")})`;
    case "If":
      return `IF ${renderExpr(node.test ?? node.condition)} THEN`;
    case "For":
      return `FOR ${node.var} <- ${renderExpr(node.start)} TO ${renderExpr(node.end)} DO`;
    case "While":
      return `WHILE (${renderExpr(node.test)}) DO`;
    case "Repeat":
      return "REPEAT";
    default:
      return null;
  }
}

function renderExpr(node: AstNode | null | undefined): string {
  if (!node) return "?";

  switch (node.type ?? node.kind) {
    case "Identifier":
      return node.name ?? "?";
    case "Literal":
      return String(node.value);
    case "Binary":
      return `${renderExpr(node.left)} ${String(node.op ?? node.operator ?? "?").toUpperCase()} ${renderExpr(node.right)}`;
    case "Unary":
      return `${String(node.op ?? node.operator ?? "").toUpperCase()} ${renderExpr(node.arg ?? node.expression)}`.trim();
    case "Call":
      return `${node.callee ?? node.name}(${(node.args ?? [])
        .map((arg) => renderExpr(arg))
        .join(", ")})`;
    case "Index":
      if (node.index)
        return `${renderExpr(node.target)}[${renderExpr(node.index)}]`;
      if (node.range) {
        return `${renderExpr(node.target)}[${renderExpr(node.range.start)}:${renderExpr(node.range.end)}]`;
      }
      return `${renderExpr(node.target)}[]`;
    case "Field":
      return `${renderExpr(node.target)}.${node.name}`;
    default:
      return String(node.name ?? node.callee ?? node.type ?? "?");
  }
}
