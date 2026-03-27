"use client";

import { useTranslations } from "next-intl";
import React from "react";

import NavigationLink from "@/components/NavigationLink";
import {
  EXAMPLE_CATEGORY_ORDER,
  EXAMPLE_CATEGORY_META,
} from "@/lib/examples/catalog";
import {
  CATEGORY_LABEL_KEYS,
  CATEGORY_OFFTEXT_KEYS,
} from "@/lib/examples/i18n";

interface ExamplesTypeSelectorProps {
  ctaLabel: string;
}

export function ExamplesTypeSelector({ ctaLabel }: ExamplesTypeSelectorProps) {
  const t = useTranslations();

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
                {t(CATEGORY_LABEL_KEYS[category])}
              </h3>
              <p className="line-clamp-4 text-sm text-dark-text">
                {t(CATEGORY_OFFTEXT_KEYS[category])}
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
