"use client";

import type { SolvedExampleBlock as SolvedExampleBlockType } from "@aa/content-catalog";

import type { ContentTargetMap } from "@/lib/content/types";

import Formula from "../Formula";
import { InlineRichTextRenderer } from "../InlineRichTextRenderer";

interface SolvedExampleBlockProps {
  block: SolvedExampleBlockType;
  targetMap: ContentTargetMap;
}

export function SolvedExampleBlock({
  block,
  targetMap,
}: SolvedExampleBlockProps) {
  return (
    <section
      id={block.id}
      className="space-y-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5"
    >
      <h3 className="text-lg font-semibold text-white">{block.title}</h3>
      {block.problem ? (
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-7 text-slate-200">
          <InlineRichTextRenderer
            content={block.problem}
            targetMap={targetMap}
          />
        </div>
      ) : null}
      <div className="space-y-4">
        {block.steps.map((step, index) => (
          <article
            key={step.stepId}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="mb-2 text-sm font-semibold text-white">
              {index + 1}. {step.title}
            </div>
            <div className="text-sm leading-7 text-slate-200">
              <InlineRichTextRenderer
                content={step.explanation}
                targetMap={targetMap}
              />
            </div>
            {step.latex ? (
              <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/70 px-4 py-4 text-center">
                <Formula latex={step.latex} display />
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {block.answer ? (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-50">
          <InlineRichTextRenderer
            content={block.answer}
            targetMap={targetMap}
          />
        </div>
      ) : null}
    </section>
  );
}
