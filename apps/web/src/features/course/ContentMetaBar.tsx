"use client";

import type { CatalogModule } from "@aa/content-catalog";

interface ContentMetaBarProps {
  module: CatalogModule;
}

const difficultyLabels: Record<string, string> = {
  foundational: "Foundational",
  basic: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function ContentMetaBar({ module }: ContentMetaBarProps) {
  const items = [
    module.estimatedMinutes
      ? { label: "Estimated time", value: `${module.estimatedMinutes} min` }
      : null,
    module.difficulty
      ? {
          label: "Difficulty",
          value: difficultyLabels[module.difficulty] ?? module.difficulty,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <section className="flex flex-wrap items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
        >
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
            {item.label}
          </div>
          <div className="text-sm font-medium text-white">{item.value}</div>
        </div>
      ))}
      {module.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {module.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-100"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
