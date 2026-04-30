"use client";

import type { MethodCardBlock } from "@aa/content-catalog";

import type { ContentTargetMap } from "@/lib/content/types";

import { InlineRichTextRenderer } from "../InlineRichTextRenderer";

interface RecurrenceMethodCardProps {
  block: MethodCardBlock;
  targetMap: ContentTargetMap;
}

export function RecurrenceMethodCard({
  block,
  targetMap,
}: RecurrenceMethodCardProps) {
  const sections = [
    { label: "Resumen", items: block.summary ? [block.summary] : [] },
    { label: "Cuándo usar", items: block.whenToUse ?? [] },
    { label: "Pasos", items: block.steps ?? [] },
    { label: "Trampas", items: block.pitfalls ?? [] },
  ].filter((section) => section.items.length > 0);

  return (
    <section
      id={block.id}
      className="space-y-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"
    >
      <h3 className="text-lg font-semibold text-white">{block.title}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.label}
            className="rounded-xl border border-white/10 bg-slate-950/50 p-4"
          >
            <div className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              {section.label}
            </div>
            <div className="space-y-2 text-sm leading-7 text-slate-200">
              {section.items.map((item, index) => (
                <div key={`${section.label}-${index}`}>
                  <InlineRichTextRenderer
                    content={item}
                    targetMap={targetMap}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
