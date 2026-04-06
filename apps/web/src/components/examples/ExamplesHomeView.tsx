"use client";

import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

import { EmbeddedAssistantLauncher } from "@/components/assistant/EmbeddedAssistantLauncher";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useNavigation } from "@/contexts/NavigationContext";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import { useRouter } from "@/i18n/navigation";
import type { AssistantContext } from "@/lib/assistant/types";
import {
  buildAssistantExampleListContext,
  buildAssistantExampleSectionsContext,
} from "@/lib/examples/assistant-context";
import {
  getEnabledExamples,
  getMethodTranslationKey,
  isRecursiveCategory,
  type ExampleLocale,
  type RecursiveMethodBadge,
  examplesCatalog,
} from "@/lib/examples/catalog";
import {
  CATEGORY_LABEL_KEYS,
  FAMILY_LABEL_KEYS,
  getLocalizedExampleContent,
  type LocalizedExampleCatalogItem,
} from "@/lib/examples/i18n";

import { ExamplesTypeSelector } from "./ExamplesTypeSelector";

const METHOD_BADGE_CLASSNAMES: Record<RecursiveMethodBadge, string> = {
  TM: "border-orange-500/40 bg-orange-500/15 text-orange-200",
  IT: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  AR: "border-cyan-500/40 bg-cyan-500/15 text-cyan-200",
  EC: "border-blue-500/40 bg-blue-500/15 text-blue-200",
};

export function ExamplesHomeView() {
  const locale = useLocale() as ExampleLocale;
  const t = useTranslations("examples");
  const tGlobal = useTranslations();
  const catalogItems = t.raw("catalogItems") as Record<
    string,
    LocalizedExampleCatalogItem
  >;
  const router = useRouter();
  const { finishNavigation } = useNavigation();
  const [query, setQuery] = useState("");
  const { runAnalysis } = useRunAnalysis();

  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  const topMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    const enabled = getEnabledExamples(examplesCatalog);
    return enabled
      .map((item) => {
        const copy = getLocalizedExampleContent(item, catalogItems, locale);
        const normalizedTitle = copy.title.toLowerCase();
        const normalizedSummary = copy.summary.toLowerCase();
        const normalizedTags = copy.tags.map((tag) => tag.toLowerCase());
        const bilingualTitleEs = item.copy.es.title.toLowerCase();
        const bilingualSummaryEs = item.copy.es.summary.toLowerCase();
        const bilingualTagsEs = item.copy.es.tags.map((tag) =>
          tag.toLowerCase(),
        );
        const bilingualTitleEn = item.copy.en.title.toLowerCase();
        const bilingualSummaryEn = item.copy.en.summary.toLowerCase();
        const bilingualTagsEn = item.copy.en.tags.map((tag) =>
          tag.toLowerCase(),
        );
        const normalizedCategory = tGlobal(
          CATEGORY_LABEL_KEYS[item.category],
        ).toLowerCase();

        if (
          !normalizedTitle.includes(normalizedQuery) &&
          !normalizedSummary.includes(normalizedQuery) &&
          !normalizedTags.some((tag) => tag.includes(normalizedQuery)) &&
          !bilingualTitleEs.includes(normalizedQuery) &&
          !bilingualSummaryEs.includes(normalizedQuery) &&
          !bilingualTagsEs.some((tag) => tag.includes(normalizedQuery)) &&
          !bilingualTitleEn.includes(normalizedQuery) &&
          !bilingualSummaryEn.includes(normalizedQuery) &&
          !bilingualTagsEn.some((tag) => tag.includes(normalizedQuery)) &&
          !normalizedCategory.includes(normalizedQuery)
        ) {
          return null;
        }

        let score = 0;
        if (normalizedTitle === normalizedQuery) score += 120;
        if (normalizedTitle.startsWith(normalizedQuery)) score += 80;
        if (normalizedTitle.includes(normalizedQuery)) score += 50;
        if (bilingualTitleEs.startsWith(normalizedQuery)) score += 40;
        if (bilingualTitleEn.startsWith(normalizedQuery)) score += 40;
        if (bilingualTitleEs.includes(normalizedQuery)) score += 25;
        if (bilingualTitleEn.includes(normalizedQuery)) score += 25;
        if (normalizedSummary.includes(normalizedQuery)) score += 20;
        if (bilingualSummaryEs.includes(normalizedQuery)) score += 10;
        if (bilingualSummaryEn.includes(normalizedQuery)) score += 10;
        if (normalizedCategory.includes(normalizedQuery)) score += 15;
        if (normalizedTags.some((tag) => tag.startsWith(normalizedQuery))) {
          score += 25;
        } else if (
          normalizedTags.some((tag) => tag.includes(normalizedQuery))
        ) {
          score += 12;
        }
        if (
          bilingualTagsEs.some((tag) => tag.startsWith(normalizedQuery)) ||
          bilingualTagsEn.some((tag) => tag.startsWith(normalizedQuery))
        ) {
          score += 12;
        } else if (
          bilingualTagsEs.some((tag) => tag.includes(normalizedQuery)) ||
          bilingualTagsEn.some((tag) => tag.includes(normalizedQuery))
        ) {
          score += 6;
        }

        return { item, score };
      })
      .filter(
        (entry): entry is { item: (typeof enabled)[number]; score: number } =>
          entry !== null,
      )
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const aTitle = getLocalizedExampleContent(
          a.item,
          catalogItems,
          locale,
        ).title;
        const bTitle = getLocalizedExampleContent(
          b.item,
          catalogItems,
          locale,
        ).title;
        return aTitle.localeCompare(bTitle, locale);
      })
      .slice(0, 3)
      .map((entry) => entry.item);
  }, [catalogItems, locale, query, tGlobal]);

  const handleSelectMatch = (slug: string, category: string) => {
    router.push(`/examples/${category}?example=${slug}`);
    setQuery("");
  };

  const assistantContext = useMemo<AssistantContext>(
    () => ({
      surface: "examples",
      locale,
      pageContext: {
        route: "/examples",
        view: "home",
        title: t("title"),
        description: t("subtitle"),
        query: query.trim() || undefined,
        notes:
          topMatches.length > 0
            ? [
                `matchedExamples=${topMatches.length}`,
                ...topMatches.map(
                  (item) =>
                    getLocalizedExampleContent(item, catalogItems, locale).title,
                ),
              ]
            : undefined,
      },
      exampleSections: buildAssistantExampleSectionsContext(
        catalogItems,
        locale,
        tGlobal,
      ),
      visibleExamples:
        topMatches.length > 0
          ? buildAssistantExampleListContext(
              topMatches,
              catalogItems,
              locale,
              tGlobal,
              { includeSource: true },
            )
          : undefined,
    }),
    [catalogItems, locale, query, t, tGlobal, topMatches],
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
        <section className="space-y-4">
          <div className="relative">
            <label className="glass-card flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3">
              <span className="material-symbols-outlined text-slate-400">
                search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && topMatches.length > 0) {
                    const first = topMatches[0];
                    handleSelectMatch(first.slug, first.category);
                  }
                }}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAriaLabel")}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>
            {query.trim() && (
              <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#182431] shadow-xl">
                {topMatches.length > 0 ? (
                  <ul className="divide-y divide-white/10">
                    {topMatches.map((item) => {
                      const copy = getLocalizedExampleContent(
                        item,
                        catalogItems,
                        locale,
                      );
                      const recursive = isRecursiveCategory(item.category);
                      const kindLabel = t("kind.recursive");
                      const iterativeLabel = t("kind.iterative");
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectMatch(item.slug, item.category)
                            }
                            className="w-full px-4 py-3 text-left transition-colors hover:bg-white/5"
                          >
                            <div className="text-sm font-semibold text-white">
                              {copy.title}
                            </div>
                            <div className="mt-1 text-xs text-neutral-300">
                              {tGlobal(CATEGORY_LABEL_KEYS[item.category])}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="rounded-full border border-neutral-600 bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-200">
                                {tGlobal(FAMILY_LABEL_KEYS[item.family])}
                              </span>
                              <span className="rounded-full border border-neutral-600 bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-200">
                                {recursive ? kindLabel : iterativeLabel}
                              </span>
                              {recursive &&
                                item.verifiedMethods.map((method) => (
                                  <span
                                    key={method}
                                    title={tGlobal(
                                      getMethodTranslationKey(method),
                                    )}
                                    aria-label={tGlobal(
                                      getMethodTranslationKey(method),
                                    )}
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${METHOD_BADGE_CLASSNAMES[method]}`}
                                  >
                                    {method}
                                  </span>
                                ))}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-neutral-300">
                    {t("emptyTitle")}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section>
          <ExamplesTypeSelector ctaLabel={t("viewFamily")} />
        </section>
      </main>
      <EmbeddedAssistantLauncher
        surface="examples"
        assistantContext={assistantContext}
        onAnalyzeCode={(code) => {
          void runAnalysis(code);
        }}
      />
      <Footer />
    </div>
  );
}
