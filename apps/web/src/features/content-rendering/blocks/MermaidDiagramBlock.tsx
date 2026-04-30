"use client";

import type { MermaidDiagramBlock as MermaidDiagramBlockType } from "@aa/content-catalog";

interface MermaidDiagramBlockProps {
  block: MermaidDiagramBlockType;
}

export function MermaidDiagramBlock({ block }: MermaidDiagramBlockProps) {
  return (
    <section
      id={block.id}
      className="space-y-3 rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
          {block.title ?? "Mermaid"}
        </h3>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-100">
          Diagram
        </span>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#08111a] p-4 text-sm leading-6 text-cyan-100">
        <code>{block.code}</code>
      </pre>
      {block.caption ? (
        <p className="text-xs text-slate-400">{block.caption}</p>
      ) : null}
    </section>
  );
}
