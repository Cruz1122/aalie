"use client";

import React from "react";

import NavigationLink from "@/components/NavigationLink";
import {
  EXAMPLE_CATEGORY_ORDER,
  EXAMPLE_CATEGORY_META,
} from "@/lib/examples/catalog";
import type { ExampleLocale } from "@/lib/examples/catalog";

interface ExamplesTypeSelectorProps {
  locale: ExampleLocale;
  ctaLabel: string;
}

export function ExamplesTypeSelector({
  locale,
  ctaLabel,
}: ExamplesTypeSelectorProps) {
  return (
    <section className="min-h-[68vh]">
      <div className="grid min-h-[68vh] grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {EXAMPLE_CATEGORY_ORDER.map((category) => {
          const meta = EXAMPLE_CATEGORY_META[category];
          return (
            <div
              key={category}
              className="glass-card grid h-full min-h-[300px] content-center grid-rows-[60px_50px_80px_100px] place-items-center rounded-md p-8 text-center xl:min-h-[68vh]"
            >
              <span
                className="material-symbols-outlined leading-none text-primary"
                style={{ fontSize: "2.75rem" }}
              >
                {meta.icon}
              </span>
              <h3 className="line-clamp-2 text-xl font-bold text-white">
                {meta.label[locale]}
              </h3>
              <p className="line-clamp-4 text-sm text-dark-text">
                {meta.offText[locale]}
              </p>
              <NavigationLink
                href={`/examples/${category}`}
                className="glass-secondary flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                {ctaLabel}
              </NavigationLink>
            </div>
          );
        })}
      </div>
    </section>
  );
}
