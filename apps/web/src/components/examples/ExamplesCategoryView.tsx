"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { NavigationFooter } from "@/components/NavigationFooter";
import { PageHeader } from "@/components/PageHeader";
import { useNavigation } from "@/contexts/NavigationContext";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import {
  filterByMethods,
  getCategoryMeta,
  getExamplesByCategory,
  isRecursiveCategory,
  searchExamples,
  type ExampleCatalogItem,
  type ExampleCategory,
  type ExampleLocale,
  type RecursiveMethodBadge,
} from "@/lib/examples/catalog";

import { ExamplesCatalogList } from "./ExamplesCatalogList";
import { ExamplesMethodFilters } from "./ExamplesMethodFilters";
import { ExamplesSearchInput } from "./ExamplesSearchInput";

interface ExamplesCategoryViewProps {
  category: ExampleCategory;
}

export function ExamplesCategoryView({ category }: ExamplesCategoryViewProps) {
  const locale = useLocale() as ExampleLocale;
  const t = useTranslations("examples");
  const searchParams = useSearchParams();
  const { finishNavigation } = useNavigation();
  const [query, setQuery] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<RecursiveMethodBadge[]>([]);
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
  const recursiveCategory = isRecursiveCategory(category);
  const selectedSlug = searchParams.get("example");

  const visibleExamples = useMemo(() => {
    const categoryItems = getExamplesByCategory(category, {
      enabledOnly: true,
      locale,
    });
    const searched = searchExamples(categoryItems, locale, query);
    return recursiveCategory
      ? filterByMethods(searched, selectedMethods)
      : searched;
  }, [category, locale, query, recursiveCategory, selectedMethods]);

  const selectedExampleId =
    selectedSlug != null
      ? visibleExamples.find((example) => example.slug === selectedSlug)?.id ?? null
      : null;

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
    void runAnalysis(example.sourceCode);
  };

  const toggleMethod = (method: RecursiveMethodBadge) => {
    setSelectedMethods((previous) =>
      previous.includes(method)
        ? previous.filter((current) => current !== method)
        : [...previous, method],
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <PageHeader
            icon={meta.icon}
            title={meta.label[locale]}
            description={meta.offText[locale]}
          />

          <div className="space-y-4">
            <ExamplesSearchInput
              value={query}
              onChange={setQuery}
              placeholder={t("searchPlaceholder")}
              ariaLabel={t("searchAriaLabel")}
              filtersButtonAriaLabel={recursiveCategory ? t("filtersTitle") : undefined}
              onToggleFilters={recursiveCategory ? () => setFiltersOpen((prev) => !prev) : undefined}
              filtersActive={recursiveCategory ? filtersOpen : false}
              filtersDropdown={
                recursiveCategory ? (
                  <ExamplesMethodFilters
                    locale={locale}
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
      <Footer />
    </div>
  );
}
