import type {
  DocumentBlock,
  DocumentBlockStatus,
  DocumentSection,
  DocumentTable,
} from "../../document-model-builder";
import type { ExportI18nBundle } from "../../../infrastructure/i18n";
import { isLikelyMathExpression, isTechnicalToken } from "../../shared/math-format";

const LATEX_TEXT_ESCAPE_MAP: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "&": "\\&",
  "%": "\\%",
  "$": "\\$",
  "#": "\\#",
  "_": "\\_",
  "{": "\\{",
  "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

export function escapeLatexText(text: string): string {
  return text.replace(/[\\&%$#_{}~^]/g, (token) => LATEX_TEXT_ESCAPE_MAP[token] || token);
}

function renderLatexTextWithInlineMath(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }
  if (normalized.includes(";")) {
    return escapeLatexText(normalized);
  }

  const separatorIndex = normalized.indexOf(":");
  if (separatorIndex > -1) {
    const left = normalized.slice(0, separatorIndex + 1);
    const right = normalized.slice(separatorIndex + 1).trim();
    if (!/[;,]/.test(right) && isLikelyMathExpression(right)) {
      return `${escapeLatexText(left)} $${right}$`;
    }
  }

  if (isLikelyMathExpression(normalized)) {
    return `$${normalized}$`;
  }

  return escapeLatexText(normalized);
}

function renderLatexCellValue(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  if (isLikelyMathExpression(normalized)) {
    return `$${normalized}$`;
  }

  if (isTechnicalToken(normalized)) {
    return `\\texttt{\\detokenize{${normalized}}}`;
  }

  return escapeLatexText(normalized);
}

function renderLatexTable(table: DocumentTable, i18n: ExportI18nBundle): string {
  const columnCount = Math.max(1, table.headers.length);
  const width = Math.max(0.95 / columnCount, 0.15).toFixed(3);
  const spec = Array(columnCount).fill(`p{${width}\\linewidth}`).join("|");
  const lines: string[] = [];

  if (table.title) {
    lines.push(`\\paragraph{${escapeLatexText(table.title)}}`);
  }

  lines.push("\\begin{center}");
  lines.push("\\begingroup");
  lines.push("\\footnotesize");
  lines.push("\\setlength{\\tabcolsep}{3pt}");
  lines.push("\\renewcommand{\\arraystretch}{1.12}");
  lines.push("\\resizebox{\\linewidth}{!}{%");
  lines.push(`\\begin{tabular}{|${spec}|}`);
  lines.push("\\hline");
  lines.push(`${table.headers.map((header) => escapeLatexText(header)).join(" & ")} \\\\`);
  lines.push("\\hline");

  if (table.rows.length === 0) {
    lines.push(`\\multicolumn{${columnCount}}{|l|}{${escapeLatexText(i18n.notAvailable)}} \\\\`);
    lines.push("\\hline");
  } else {
    for (const row of table.rows) {
      const normalizedRow = Array.from({ length: columnCount }, (_, index) => row[index] || "");
      lines.push(`${normalizedRow.map((cell) => renderLatexCellValue(cell)).join(" & ")} \\\\`);
      lines.push("\\hline");
    }
  }

  lines.push("\\end{tabular}%");
  lines.push("}");
  lines.push("\\endgroup");
  lines.push("\\end{center}");
  return lines.join("\n");
}

function renderLatexStatus(status: DocumentBlockStatus, i18n: ExportI18nBundle): string {
  const lines = [
    `\\paragraph{${escapeLatexText(status.label)}}`,
    `\\textbf{${escapeLatexText(i18n.statusPrefix)}}: ${escapeLatexText(status.message || status.status)}`,
  ];

  if (status.todos && status.todos.length > 0) {
    lines.push("\\begin{itemize}");
    for (const todo of status.todos) {
      lines.push(`\\item ${escapeLatexText(todo)}`);
    }
    lines.push("\\end{itemize}");
  }

  return lines.join("\n\n");
}

export function renderLatexBlock(block: DocumentBlock, i18n: ExportI18nBundle): string {
  if (block.kind === "paragraph") {
    return renderLatexTextWithInlineMath(block.text);
  }

  if (block.kind === "list") {
    const lines = ["\\begin{itemize}"];
    for (const item of block.items) {
      lines.push(`\\item ${renderLatexTextWithInlineMath(item)}`);
    }
    lines.push("\\end{itemize}");
    return lines.join("\n");
  }

  if (block.kind === "code") {
    return [
      "\\begin{aaliecodeblock}",
      block.code,
      "\\end{aaliecodeblock}",
    ].join("\n");
  }

  if (block.kind === "formula") {
    const pieces: string[] = [];
    if (block.label) {
      pieces.push(`\\paragraph{${escapeLatexText(block.label)}}`);
    }
    pieces.push("\\[");
    pieces.push(block.formula);
    pieces.push("\\]");
    return pieces.join("\n");
  }

  if (block.kind === "table") {
    return renderLatexTable(block.table, i18n);
  }

  if (block.kind === "keyValue") {
    const lines = ["\\begin{itemize}"];
    for (const entry of block.entries) {
      lines.push(
        `\\item \\textbf{${escapeLatexText(entry.label)}}: ${renderLatexTextWithInlineMath(entry.value)}`,
      );
    }
    lines.push("\\end{itemize}");
    return lines.join("\n");
  }

  return renderLatexStatus(block.status, i18n);
}

export function renderLatexSection(section: DocumentSection, i18n: ExportI18nBundle): string {
  const blocks = section.blocks.map((block) => renderLatexBlock(block, i18n)).join("\n\n");
  return [`\\section{${escapeLatexText(section.title)}}`, blocks].join("\n\n");
}
