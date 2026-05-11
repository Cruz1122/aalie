"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

import AALIECategoryIcon from "@/components/AALIECategoryIcon";
import { EmbeddedAssistantLauncher } from "@/components/assistant/EmbeddedAssistantLauncher";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { NavigationFooter } from "@/components/NavigationFooter";
import { PageHeader } from "@/components/PageHeader";
import { useNavigation } from "@/contexts/NavigationContext";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import type { AssistantContext } from "@/lib/assistant/types";
import {
  buildAssistantExampleContext,
  buildAssistantExampleListContext,
} from "@/lib/examples/assistant-context";
import {
  categoryHasRecursiveMethods,
  filterByMethods,
  getCategoryMeta,
  getExamplesByCategory,
  getLocalizedExampleSource,
  type ExampleCatalogItem,
  type ExampleCategory,
  type ExampleLocale,
  type RecursiveMethodBadge,
} from "@/lib/examples/catalog";
import {
  CATEGORY_LABEL_KEYS,
  CATEGORY_OFFTEXT_KEYS,
  getLocalizedExampleContent,
  type LocalizedExampleCatalogItem,
} from "@/lib/examples/i18n";

import { ExamplesCatalogList } from "./ExamplesCatalogList";
import { ExamplesMethodFilters } from "./ExamplesMethodFilters";
import { ExamplesSearchInput } from "./ExamplesSearchInput";

interface ExamplesCategoryViewProps {
  category: ExampleCategory;
}

export function ExamplesCategoryView({ category }: ExamplesCategoryViewProps) {
  const locale = useLocale() as ExampleLocale;
  const t = useTranslations("examples");
  const tGlobal = useTranslations();
  const catalogItems = t.raw("catalogItems") as Record<
    string,
    LocalizedExampleCatalogItem
  >;
  const searchParams = useSearchParams();
  const { finishNavigation } = useNavigation();
  const [query, setQuery] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<
    RecursiveMethodBadge[]
  >([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [analyzingExampleId, setAnalyzingExampleId] = useState<string | null>(
    null,
  );
  const { runAnalysis } = useRunAnalysis({
    onComplete: () => setAnalyzingExampleId(null),
  });

  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  const meta = getCategoryMeta(category);
  const hasMethodFilters = categoryHasRecursiveMethods(category);
  const selectedSlug = searchParams.get("example");

  const visibleExamples = useMemo(() => {
    const categoryItems = getExamplesByCategory(category, {
      enabledOnly: true,
    });
    const normalized = query.trim().toLowerCase();
    const searched = !normalized
      ? categoryItems
      : categoryItems.filter((item) => {
          const localized = getLocalizedExampleContent(
            item,
            catalogItems,
            locale,
          );
          const haystack = [
            localized.title,
            localized.summary,
            ...localized.tags,
            item.copy.es.title,
            item.copy.es.summary,
            ...item.copy.es.tags,
            item.copy.en.title,
            item.copy.en.summary,
            ...item.copy.en.tags,
            tGlobal(CATEGORY_LABEL_KEYS[item.category]),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalized);
        });
    const sorted = [...searched].sort((a, b) =>
      getLocalizedExampleContent(a, catalogItems, locale).title.localeCompare(
        getLocalizedExampleContent(b, catalogItems, locale).title,
        locale,
      ),
    );
    return hasMethodFilters ? filterByMethods(sorted, selectedMethods) : sorted;
  }, [
    catalogItems,
    category,
    hasMethodFilters,
    locale,
    query,
    selectedMethods,
    tGlobal,
  ]);

  const selectedExampleId =
    selectedSlug != null
      ? (visibleExamples.find((example) => example.slug === selectedSlug)?.id ??
        null)
      : null;

  const selectedExample = useMemo(
    () =>
      selectedSlug != null
        ? visibleExamples.find((example) => example.slug === selectedSlug) ||
          null
        : null,
    [selectedSlug, visibleExamples],
  );

  useEffect(() => {
    if (!selectedExampleId) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(`example-${selectedExampleId}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedExampleId]);

  const handleAnalyze = (example: ExampleCatalogItem) => {
    setAnalyzingExampleId(example.id);
    void runAnalysis(getLocalizedExampleSource(example, locale)).finally(() => {
      setAnalyzingExampleId(null);
    });
  };

  const toggleMethod = (method: RecursiveMethodBadge) => {
    setSelectedMethods((previous) =>
      previous.includes(method)
        ? previous.filter((current) => current !== method)
        : [...previous, method],
    );
  };

  const assistantContext = useMemo<AssistantContext>(
    () => ({
      surface: "examples",
      locale,
      pageContext: {
        route: `/examples/${meta.slug}`,
        view: "category",
        title: tGlobal(CATEGORY_LABEL_KEYS[category]),
        description: tGlobal(CATEGORY_OFFTEXT_KEYS[category]),
        query: query.trim() || undefined,
        filters:
          hasMethodFilters && selectedMethods.length > 0
            ? selectedMethods
            : undefined,
        notes: [
          `visibleExamples=${visibleExamples.length}`,
          ...(selectedSlug ? [`focusedExample=${selectedSlug}`] : []),
        ],
      },
      example: selectedExample
        ? buildAssistantExampleContext(
            selectedExample,
            catalogItems,
            locale,
            tGlobal,
            { includeSource: true },
          )
        : undefined,
      visibleExamples: buildAssistantExampleListContext(
        visibleExamples,
        catalogItems,
        locale,
        tGlobal,
        { includeSource: true },
      ),
    }),
    [
      catalogItems,
      category,
      hasMethodFilters,
      locale,
      meta.slug,
      query,
      selectedExample,
      selectedMethods,
      selectedSlug,
      tGlobal,
      visibleExamples,
    ],
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <PageHeader
            icon={
              <AALIECategoryIcon category={category} size={28} />
            }
            title={tGlobal(CATEGORY_LABEL_KEYS[category])}
            description={tGlobal(CATEGORY_OFFTEXT_KEYS[category])}
          />

          <div className="space-y-4">
            <ExamplesSearchInput
              value={query}
              onChange={setQuery}
              placeholder={t("searchPlaceholder")}
              ariaLabel={t("searchAriaLabel")}
              filtersButtonAriaLabel={
                hasMethodFilters ? t("filtersTitle") : undefined
              }
              onToggleFilters={
                hasMethodFilters
                  ? () => setFiltersOpen((prev) => !prev)
                  : undefined
              }
              filtersActive={hasMethodFilters ? filtersOpen : false}
              filtersDropdown={
                hasMethodFilters ? (
                  <ExamplesMethodFilters
                    selectedMethods={selectedMethods}
                    onToggle={toggleMethod}
                  />
                ) : undefined
              }
            />
            <ExamplesCatalogList
              items={visibleExamples}
              locale={locale}
              highlightedExampleId={selectedExampleId}
              pageSize={6}
              analyzingExampleId={analyzingExampleId}
              onAnalyze={handleAnalyze}
              emptyTitle={t("emptyTitle")}
              emptyDescription={t("emptyDescription")}
              viewLabel={t("viewAlgorithm")}
              hideLabel={t("hideAlgorithm")}
              analyzeLabel={t("analyze")}
              analyzingLabel={t("analyzing")}
            />
          </div>

          <NavigationFooter
            namespace="examples"
            prev={{ href: "/examples", labelKey: "backToExamplesHome" }}
            next={{ href: "/analyzer", labelKey: "goToAnalyzer" }}
          />
        </div>
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
