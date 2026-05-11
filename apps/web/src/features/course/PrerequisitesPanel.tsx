"use client";

import type { CatalogModule, CatalogSection } from "@aa/content-catalog";

import { Link } from "@/i18n/navigation";
import type {
  ContentModuleSummary,
  ContentTargetMap,
} from "@/lib/content/types";

interface PrerequisitesPanelProps {
  title: string;
  prerequisites?:
    | CatalogModule["prerequisites"]
    | CatalogSection["prerequisites"];
  modules: ContentModuleSummary[];
  targetMap: ContentTargetMap;
}

export function PrerequisitesPanel({
  title,
  prerequisites,
  modules,
  targetMap,
}: PrerequisitesPanelProps) {
  const moduleEntries =
    prerequisites?.modules?.map((entry) => ({
      label:
        modules.find((module) => module.moduleId === entry.id)?.title ??
        entry.id,
      href: targetMap[`module:${entry.id}`]?.href,
      kind: entry.kind,
    })) ?? [];
  const sectionEntries =
    prerequisites?.sections?.map((entry) => ({
      label: targetMap[`section:${entry.id}`]?.title ?? entry.id,
      href: targetMap[`section:${entry.id}`]?.href,
      kind: entry.kind,
    })) ?? [];
  const entries = [...moduleEntries, ...sectionEntries];

  if (!entries.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/90">
        {title}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map((entry, index) =>
          entry.href ? (
            <Link
              key={`${entry.label}-${index}`}
              href={entry.href}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-100 transition-colors hover:bg-white/10"
            >
              {entry.kind === "required" ? "Requisito" : "Recomendado"}:{" "}
              {entry.label}
            </Link>
          ) : (
            <span
              key={`${entry.label}-${index}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-100"
            >
              {entry.kind === "required" ? "Requisito" : "Recomendado"}:{" "}
              {entry.label}
            </span>
          ),
        )}
      </div>
    </section>
  );
}
