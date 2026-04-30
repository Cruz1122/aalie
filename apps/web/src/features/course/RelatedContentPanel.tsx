"use client";

import type { ContentReference } from "@aa/content-catalog";

import type {
  ContentModuleSummary,
  ContentTargetMap,
} from "@/lib/content/types";

import { ContentReferenceBadge } from "./ContentReferenceBadge";

interface RelatedContentPanelProps {
  relatedModuleIds?: string[];
  contentRefs?: ContentReference[];
  modules: ContentModuleSummary[];
  targetMap: ContentTargetMap;
}

export function RelatedContentPanel({
  relatedModuleIds = [],
  contentRefs = [],
  modules,
  targetMap,
}: RelatedContentPanelProps) {
  const references = [
    ...relatedModuleIds.map((moduleId) => ({
      refId: moduleId,
      label:
        modules.find((module) => module.moduleId === moduleId)?.title ??
        moduleId,
      target: { kind: "module" as const, ref: moduleId },
      tone: "primary" as const,
    })),
    ...contentRefs,
  ];

  if (!references.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100/90">
        Contenido relacionado
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {references.map((reference) => (
          <ContentReferenceBadge
            key={reference.refId}
            reference={reference}
            targetMap={targetMap}
          />
        ))}
      </div>
    </section>
  );
}
