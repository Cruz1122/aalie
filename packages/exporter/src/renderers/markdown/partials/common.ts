import type {
  DocumentBlock,
  DocumentBlockStatus,
  DocumentSection,
  DocumentTable,
} from "../../document-model-builder";
import type { ExportI18nBundle } from "../../../infrastructure/i18n";
import { toMarkdownInlineMath, toMarkdownTextWithInlineMath } from "../../shared/math-format";

function escapePipes(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function renderMarkdownCell(value: string): string {
  return toMarkdownInlineMath(value);
}

export function renderMarkdownTable(table: DocumentTable): string {
  const headers = table.headers.map((header) => escapePipes(header));
  const lines: string[] = [];

  if (table.title) {
    lines.push(`**${table.title}**`);
  }

  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);

  for (const row of table.rows) {
    const safeRow = row.map((cell) => escapePipes(renderMarkdownCell(cell)));
    lines.push(`| ${safeRow.join(" | ")} |`);
  }

  return lines.join("\n");
}

export function renderMarkdownStatus(
  status: DocumentBlockStatus,
  i18n: ExportI18nBundle,
): string {
  const lines = [
    `> ${status.label}`,
    `> ${status.message || status.status}`,
  ];

  if (status.todos && status.todos.length > 0) {
    lines.push(`> ${i18n.todoPrefix}: ${status.todos.join("; ")}`);
  }

  return lines.join("\n");
}

export function renderMarkdownBlock(
  block: DocumentBlock,
  i18n: ExportI18nBundle,
): string {
  if (block.kind === "paragraph") {
    return toMarkdownTextWithInlineMath(block.text);
  }

  if (block.kind === "list") {
    return block.items
      .map((item) => `- ${toMarkdownTextWithInlineMath(item)}`)
      .join("\n");
  }

  if (block.kind === "code") {
    return `\`\`\`${block.language || "text"}\n${block.code}\n\`\`\``;
  }

  if (block.kind === "formula") {
    if (block.label) {
      return `**${block.label}**\n\n$$\n${block.formula}\n$$`;
    }
    return `$$\n${block.formula}\n$$`;
  }

  if (block.kind === "table") {
    return renderMarkdownTable(block.table);
  }

  if (block.kind === "keyValue") {
    return block.entries
      .map((entry) => `- **${entry.label}:** ${toMarkdownTextWithInlineMath(entry.value)}`)
      .join("\n");
  }

  return renderMarkdownStatus(block.status, i18n);
}

export function renderMarkdownSection(
  section: DocumentSection,
  i18n: ExportI18nBundle,
): string {
  const blocks = section.blocks.map((block) => renderMarkdownBlock(block, i18n)).join("\n\n");
  return `## ${section.title}\n\n${blocks}`;
}
