"use client";

import { useTranslations } from "next-intl";
import React from "react";

import AALIECategoryIcon from "@/components/AALIECategoryIcon";
import NavigationLink from "@/components/NavigationLink";
import {
  EXAMPLE_CATEGORY_ORDER,
  getCategoryMeta,
  type ExampleCategory,
} from "@/lib/examples/catalog";
import {
  CATEGORY_LABEL_KEYS,
  CATEGORY_OFFTEXT_KEYS,
} from "@/lib/examples/i18n";

interface ExamplesTypeSelectorProps {
  ctaLabel: string;
  categories?: ExampleCategory[];
}

export function ExamplesTypeSelector({
  ctaLabel,
  categories = EXAMPLE_CATEGORY_ORDER,
}: ExamplesTypeSelectorProps) {
  const t = useTranslations();

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 auto-rows-[minmax(260px,auto)] md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const meta = getCategoryMeta(category);
          return (
            <div
              key={category}
              className="glass-card flex h-full min-h-[260px] flex-col items-center justify-center gap-3.5 rounded-2xl p-6 text-center"
            >
              <AALIECategoryIcon
                category={category}
                size={68}
                className="shrink-0"
              />
              <h3 className="line-clamp-2 shrink-0 text-xl font-bold text-white">
                {t(CATEGORY_LABEL_KEYS[category])}
              </h3>
              <p className="line-clamp-3 max-w-prose shrink-0 text-sm leading-relaxed text-dark-text">
                {t(CATEGORY_OFFTEXT_KEYS[category])}
              </p>
              <NavigationLink
                href={`/examples/${meta.slug}`}
                className="glass-secondary flex h-10 w-full shrink-0 items-center justify-center rounded-xl px-4 text-sm font-bold text-white transition-colors hover:bg-white/20"
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
