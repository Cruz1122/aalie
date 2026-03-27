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

function normalizeLatexMathExpression(value: string): string {
  return value.replace(/([A-Za-z])_([0-9]+)\b/g, "$1_{$2}");
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

function renderLatexTextWithInlineMath(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }
  if (isNarrativeEquation(normalized)) {
    return escapeLatexText(normalized);
  }
  if (normalized.includes(";")) {
    return escapeLatexText(normalized);
  }

  const separatorIndex = normalized.indexOf(":");
  if (separatorIndex > -1) {
    const left = normalized.slice(0, separatorIndex + 1);
    const right = normalized.slice(separatorIndex + 1).trim();
    if (!/[;,]/.test(right) && isLikelyMathExpression(right)) {
      return `${escapeLatexText(left)} $${normalizeLatexMathExpression(right)}$`;
    }
  }

  if (isLikelyMathExpression(normalized)) {
    return `$${normalizeLatexMathExpression(normalized)}$`;
  }

  return escapeLatexText(normalized);
}

function renderLatexTextWithEmbeddedMath(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }
  if (!normalized.includes("$")) {
    return escapeLatexText(normalized);
  }
  const parts = normalized.split(/(\$[^$]+\$)/g).filter((part) => part.length > 0);
  return parts
    .map((part) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        return part;
      }
      return escapeLatexText(part);
    })
    .join("");
}

function renderLatexCellValue(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }
  if (isNarrativeEquation(normalized)) {
    return escapeLatexText(normalized);
  }

  if (isLikelyMathExpression(normalized)) {
    return `$${normalizeLatexMathExpression(normalized)}$`;
  }

  if (isTechnicalToken(normalized)) {
    return `\\texttt{\\detokenize{${normalized}}}`;
  }

  return escapeLatexText(normalized);
}

function renderInstitutionalCodeBlock(
  title: string | undefined,
  lines: Array<{ lineNumber?: number; text: string }>,
): string {
  const renderedLines = lines.map((line, index) => {
    const tone = index % 2 === 0 ? "ucaldasBlue" : "ingColor";
    const prefix = typeof line.lineNumber === "number" ? `${line.lineNumber}: ` : "";
    return `\\textcolor{${tone}}{${escapeLatexText(`${prefix}${line.text}`)}}\\\\`;
  });

  const output: string[] = [];
  if (title) {
    output.push(`\\GraySubsection{${escapeLatexText(title)}}`);
  }

  output.push("\\begin{center}");
  output.push("\\begin{minipage}{0.90\\linewidth}");
  output.push("\\begingroup");
  output.push("\\setlength{\\fboxsep}{6pt}");
  output.push("\\fcolorbox{aalieCodeFrame}{aalieCodeBg}{%");
  output.push("\\parbox{\\dimexpr\\linewidth-2\\fboxsep-2\\fboxrule\\relax}{%");
  output.push("\\ttfamily\\small");
  output.push(...renderedLines);
  output.push("}%");
  output.push("}");
  output.push("\\endgroup");
  output.push("\\end{minipage}");
  output.push("\\end{center}");

  return output.join("\n");
}

function isTraceTable(headers: string[]): boolean {
  if (headers.length !== 7) return false;
  const normalized = headers.map((header) => header.toLowerCase());
  const hasStep = normalized.some((header) => header.includes("paso") || header.includes("step"));
  const hasContext = normalized.some((header) => header.includes("contexto") || header.includes("context"));
  const hasCost = normalized.some((header) => header.includes("costo") || header.includes("cost"));
  return hasStep && hasContext && hasCost;
}

function buildLatexTableColumnSpec(
  headers: string[],
  align?: Array<"left" | "center" | "right">,
): string {
  if (isTraceTable(headers)) {
    return [
      ">{\\raggedright\\arraybackslash}p{0.055\\linewidth}",
      ">{\\raggedright\\arraybackslash}p{0.06\\linewidth}",
      ">{\\raggedright\\arraybackslash}p{0.125\\linewidth}",
      ">{\\raggedright\\arraybackslash}p{0.185\\linewidth}",
      ">{\\raggedright\\arraybackslash}p{0.16\\linewidth}",
      ">{\\raggedright\\arraybackslash}p{0.205\\linewidth}",
      ">{\\raggedright\\arraybackslash}p{0.095\\linewidth}",
    ].join("");
  }

  const columnCount = Math.max(1, headers.length);
  const columns = Array.from({ length: columnCount }, (_, index) => {
    const target = align?.[index] || "left";
    if (target === "center") {
      return ">{\\centering\\arraybackslash}X";
    }
    if (target === "right") {
      return ">{\\raggedleft\\arraybackslash}X";
    }
    return ">{\\raggedright\\arraybackslash}X";
  });
  return columns.join("");
}

function renderLatexTable(table: DocumentTable, i18n: ExportI18nBundle): string {
  const columnCount = Math.max(1, table.headers.length);
  const traceTable = isTraceTable(table.headers);
  const spec = buildLatexTableColumnSpec(table.headers, table.align);
  const lines: string[] = [];

  if (table.title) {
    lines.push(`\\GraySubsection{${escapeLatexText(table.title)}}`);
  }

  if (traceTable) {
    const continuedLabel =
      i18n.locale === "es" ? "Continúa en la siguiente página" : "Continued on next page";

    lines.push("\\begingroup");
    lines.push("\\footnotesize");
    lines.push("\\setlength{\\tabcolsep}{3pt}");
    lines.push("\\renewcommand{\\arraystretch}{1.15}");
    lines.push(`\\begin{longtable}{${spec}}`);
    lines.push("\\toprule");
    lines.push(
      `\\rowcolor{aalieSubsectionBg}${table.headers.map((header) => `\\textbf{${escapeLatexText(header)}}`).join(" & ")} \\\\`,
    );
    lines.push("\\midrule");
    lines.push("\\endfirsthead");
    lines.push("\\toprule");
    lines.push(
      `\\rowcolor{aalieSubsectionBg}${table.headers.map((header) => `\\textbf{${escapeLatexText(header)}}`).join(" & ")} \\\\`,
    );
    lines.push("\\midrule");
    lines.push("\\endhead");
    lines.push("\\midrule");
    lines.push(
      `\\multicolumn{${columnCount}}{r}{\\footnotesize\\color{aalieGray}${escapeLatexText(continuedLabel)}} \\\\`,
    );
    lines.push("\\endfoot");
    lines.push("\\bottomrule");
    lines.push("\\endlastfoot");

    if (table.rows.length === 0) {
      lines.push(
        `\\multicolumn{${columnCount}}{>{\\raggedright\\arraybackslash}p{0.95\\linewidth}}{${escapeLatexText(i18n.notAvailable)}} \\\\`,
      );
    } else {
      for (const row of table.rows) {
        const normalizedRow = Array.from({ length: columnCount }, (_, index) => row[index] || "");
        lines.push(`${normalizedRow.map((cell) => renderLatexCellValue(cell)).join(" & ")} \\\\`);
      }
    }

    lines.push("\\end{longtable}");
    lines.push("\\endgroup");
    return lines.join("\n");
  }

  lines.push("\\begin{center}");
  lines.push("\\begingroup");
  lines.push("\\footnotesize");
  lines.push("\\setlength{\\tabcolsep}{5pt}");
  lines.push("\\renewcommand{\\arraystretch}{1.15}");
  lines.push(`\\begin{tabularx}{0.98\\linewidth}{${spec}}`);
  lines.push("\\toprule");
  lines.push(
    `\\rowcolor{aalieSubsectionBg}${table.headers.map((header) => `\\textbf{${escapeLatexText(header)}}`).join(" & ")} \\\\`,
  );
  lines.push("\\midrule");

  if (table.rows.length === 0) {
    lines.push(
      `\\multicolumn{${columnCount}}{>{\\raggedright\\arraybackslash}p{0.95\\linewidth}}{${escapeLatexText(i18n.notAvailable)}} \\\\`,
    );
  } else {
    for (const row of table.rows) {
      const normalizedRow = Array.from({ length: columnCount }, (_, index) => row[index] || "");
      lines.push(`${normalizedRow.map((cell) => renderLatexCellValue(cell)).join(" & ")} \\\\`);
    }
  }

  lines.push("\\bottomrule");
  lines.push("\\end{tabularx}");
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
  if (block.kind === "heading") {
    return `\\paragraph{${escapeLatexText(block.text)}}`;
  }

  if (block.kind === "emphasis") {
    return `\\textbf{\\textit{${escapeLatexText(block.text)}}}`;
  }

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
      "\\begin{center}",
      "\\begin{minipage}{0.90\\linewidth}",
      "\\begin{aaliecodeblock}",
      block.code,
      "\\end{aaliecodeblock}",
      "\\end{minipage}",
      "\\end{center}",
    ].join("\n");
  }

  if (block.kind === "subsection") {
    return `\\GraySubsection{${escapeLatexText(block.title)}}`;
  }

  if (block.kind === "centeredParagraph") {
    return ["\\begin{center}", renderLatexTextWithEmbeddedMath(block.text), "\\end{center}"].join("\n");
  }

  if (block.kind === "institutionalCode") {
    return renderInstitutionalCodeBlock(block.title, block.lines);
  }

  if (block.kind === "formula") {
    const pieces: string[] = [];
    if (block.label) {
      pieces.push(`\\paragraph{${escapeLatexText(block.label)}}`);
    }
    pieces.push(`\\AALIEDisplayMath{${block.formula}}`);
    return pieces.join("\n");
  }

  if (block.kind === "pedagogicalStep") {
    const warningLabel = i18n.locale === "es" ? "Advertencia" : "Warning";
    const supportLabel = i18n.locale === "es" ? "Soporte" : "Support";
    const lines: string[] = [
      `\\paragraph{${escapeLatexText(`${block.step.index}. ${block.step.title}`)}}`,
    ];
    if (block.step.formula) {
      lines.push(`\\AALIEDisplayMath{${block.step.formula}}`);
    }
    lines.push(`{\\footnotesize\\textit{${renderLatexTextWithEmbeddedMath(block.step.explanation)}}}`);
    if (block.step.warning) {
      lines.push(
        `{\\footnotesize\\textit{${escapeLatexText(warningLabel)}: ${renderLatexTextWithEmbeddedMath(block.step.warning)}}}`,
      );
    }
    if (block.step.supportReason) {
      lines.push(
        `{\\footnotesize\\textit{${escapeLatexText(supportLabel)}: ${renderLatexTextWithEmbeddedMath(block.step.supportReason)}}}`,
      );
    }
    return lines.join("\n");
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

  if (block.kind === "executionTraceDiagram") {
    const caption = i18n.locale === "es"
      ? `Seguimiento de ejecución recursiva (${escapeLatexText(i18n.caseLabels[block.diagram.caseName])}).`
      : `Recursive execution trace tracking (${escapeLatexText(i18n.caseLabels[block.diagram.caseName])}).`;

    const summaryLine = i18n.locale === "es"
      ? `Llamadas: ${block.diagram.stats.totalCalls}; profundidad máxima: ${block.diagram.stats.maxDepth}.`
      : `Calls: ${block.diagram.stats.totalCalls}; max depth: ${block.diagram.stats.maxDepth}.`;

    const lines = [
      "\\FloatBarrier",
      "\\begin{figure}[H]",
      "\\centering",
      `\\includegraphics[width=0.98\\linewidth,keepaspectratio]{${escapeLatexText(block.diagram.assetPdfPath)}}`,
      `\\caption{${caption}}`,
      "\\end{figure}",
      "\\FloatBarrier",
      `\\textbf{${escapeLatexText(summaryLine)}}`,
    ];

    if (block.diagram.diagnostics?.truncated) {
      lines.push(
        `${escapeLatexText(i18n.locale === "es"
          ? "Advertencia: la traza fue truncada por límites de ejecución."
          : "Warning: trace was truncated by execution limits.")}`,
      );
    }

    return lines.join("\n");
  }

  return renderLatexStatus(block.status, i18n);
}

export function renderLatexSection(section: DocumentSection, i18n: ExportI18nBundle): string {
  const blocks = section.blocks.map((block) => renderLatexBlock(block, i18n)).join("\n\n");
  return [`\\section{${escapeLatexText(section.title)}}`, blocks].join("\n\n");
}
