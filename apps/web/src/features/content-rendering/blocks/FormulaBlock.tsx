"use client";

import type { EquationBlock } from "@aa/content-catalog";

import Formula from "../Formula";

interface FormulaBlockProps {
  block: EquationBlock;
}

export function FormulaBlock({ block }: FormulaBlockProps) {
  return (
    <section id={block.id} className="space-y-3">
      {block.title ? (
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          {block.title}
        </h3>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-5 text-center">
        <Formula latex={block.latex} display />
      </div>
      {block.caption ? (
        <p className="text-xs text-slate-400">{block.caption}</p>
      ) : null}
    </section>
  );
}
