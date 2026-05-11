"use client";

import type {
  ComplexityTableBlock,
  FormulaComparisonTableBlock,
  TableBlock,
} from "@aa/content-catalog";

import type { ContentTargetMap } from "@/lib/content/types";

import { InlineRichTextRenderer } from "../InlineRichTextRenderer";

type SupportedTableBlock =
  | TableBlock
  | ComplexityTableBlock
  | FormulaComparisonTableBlock;

interface ResponsiveContentTableProps {
  block: SupportedTableBlock;
  targetMap: ContentTargetMap;
}

export function ResponsiveContentTable({
  block,
  targetMap,
}: ResponsiveContentTableProps) {
  return (
    <section id={block.id} className="space-y-3">
      {block.title ? (
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          {block.title}
        </h3>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5">
            <tr>
              {block.columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left font-semibold text-slate-200 ${
                    column.align === "center"
                      ? "text-center"
                      : column.align === "right"
                        ? "text-right"
                        : ""
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {block.rows.map((row, rowIndex) => (
              <tr key={`${block.id}-${rowIndex}`}>
                {row.cells.map((cell, cellIndex) => (
                  <td
                    key={`${block.id}-${rowIndex}-${cellIndex}`}
                    className="px-4 py-3 align-top text-slate-200"
                  >
                    <InlineRichTextRenderer
                      content={cell}
                      targetMap={targetMap}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
