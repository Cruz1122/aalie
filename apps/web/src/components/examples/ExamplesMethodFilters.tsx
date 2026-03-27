"use client";

import React from "react";

import type {
  ExampleLocale,
  RecursiveMethodBadge,
} from "@/lib/examples/catalog";
import { getMethodTooltip } from "@/lib/examples/catalog";

const METHOD_META: Record<
  RecursiveMethodBadge,
  { label: string; className: string }
> = {
  TM: {
    label: "TM",
    className: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  },
  IT: {
    label: "IT",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
  AR: {
    label: "AR",
    className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  },
  EC: {
    label: "EC",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  },
};

interface ExamplesMethodFiltersProps {
  locale: ExampleLocale;
  selectedMethods: RecursiveMethodBadge[];
  onToggle: (method: RecursiveMethodBadge) => void;
}

export function ExamplesMethodFilters({
  locale,
  selectedMethods,
  onToggle,
}: ExamplesMethodFiltersProps) {
  return (
    <section className="glass-card rounded-xl border border-white/10 p-2">
      <div className="flex flex-wrap gap-2">
        {Object.entries(METHOD_META).map(([method, meta]) => {
          const active = selectedMethods.includes(method as RecursiveMethodBadge);
          return (
            <button
              key={method}
              type="button"
              onClick={() => onToggle(method as RecursiveMethodBadge)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? meta.className
                  : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white"
              }`}
            >
              {getMethodTooltip(method as RecursiveMethodBadge, locale)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
