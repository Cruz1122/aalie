"use client";

import type { LatexStepsBlock } from "@aa/content-catalog";

import type { ContentTargetMap } from "@/lib/content/types";

import Formula from "../Formula";
import { InlineRichTextRenderer } from "../InlineRichTextRenderer";

interface FormulaStepBlockProps {
  block: LatexStepsBlock;
  targetMap: ContentTargetMap;
}

export function FormulaStepBlock({ block, targetMap }: FormulaStepBlockProps) {
  return (
    <section
      id={block.id}
      className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4"
    >
      {block.title ? (
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          {block.title}
        </h3>
      ) : null}
      <div className="space-y-4">
        {block.steps.map((step, index) => (
          <article
            key={step.stepId}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="mb-2 text-sm font-semibold text-white">
              {step.title ?? `Paso ${index + 1}`}
            </div>
            {step.explanation ? (
              <p className="mb-3 text-sm leading-7 text-slate-200">
                <InlineRichTextRenderer
                  content={step.explanation}
                  targetMap={targetMap}
                />
              </p>
            ) : null}
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/70 px-4 py-4 text-center">
              <Formula latex={step.latex} display />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
