"use client";

import type {
  ImageResource,
  ReferenceResource,
  StepSequenceBlock,
} from "@aa/content-catalog";

import type { ContentTargetMap } from "@/lib/content/types";

import { NestedBlocks } from "../NestedBlocks";

interface MethodStepsBlockProps {
  block: StepSequenceBlock;
  targetMap: ContentTargetMap;
  termsById?: Record<string, { label: string; definition: string }>;
  resourcesById?: Record<string, ImageResource | ReferenceResource>;
}

export function MethodStepsBlock({
  block,
  targetMap,
  termsById,
  resourcesById,
}: MethodStepsBlockProps) {
  return (
    <section
      id={block.id}
      className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5"
    >
      <h3 className="text-lg font-semibold text-white">{block.title}</h3>
      <div className="space-y-4">
        {block.steps.map((step, index) => (
          <article
            key={step.stepId}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/15 text-sm font-semibold text-sky-100">
                {index + 1}
              </span>
              <h4 className="text-base font-semibold text-white">
                {step.title}
              </h4>
            </div>
            <NestedBlocks
              blocks={step.blocks}
              targetMap={targetMap}
              termsById={termsById}
              resourcesById={resourcesById}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
