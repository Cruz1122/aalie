"use client";

import type { WarningTrapBlock } from "@aa/content-catalog";

import type { ContentTargetMap } from "@/lib/content/types";

import { InlineRichTextRenderer } from "../InlineRichTextRenderer";

interface TrapCalloutProps {
  block: WarningTrapBlock;
  targetMap: ContentTargetMap;
}

export function TrapCallout({ block, targetMap }: TrapCalloutProps) {
  const entries = [
    { label: "Confusión común", content: block.misconception },
    { label: "Por qué falla", content: block.whyItFails },
    { label: "Cómo corregirlo", content: block.fix },
  ].filter((entry) => entry.content);

  return (
    <section
      id={block.id}
      className="space-y-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5"
    >
      <h3 className="text-lg font-semibold text-rose-100">{block.title}</h3>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.label}
            className="rounded-xl border border-white/10 bg-slate-950/40 p-4"
          >
            <div className="mb-2 text-xs uppercase tracking-[0.16em] text-rose-200/80">
              {entry.label}
            </div>
            <div className="text-sm leading-7 text-slate-100">
              <InlineRichTextRenderer
                content={entry.content}
                targetMap={targetMap}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
