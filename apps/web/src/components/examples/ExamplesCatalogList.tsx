"use client";

import React, { useEffect, useMemo, useState } from "react";

import type { ExampleCatalogItem, ExampleLocale } from "@/lib/examples/catalog";

import { ExampleCatalogCard } from "./ExampleCatalogCard";

interface ExamplesCatalogListProps {
  items: ExampleCatalogItem[];
  locale: ExampleLocale;
  showCategory?: boolean;
  highlightedExampleId?: string | null;
  pageSize?: number;
  analyzingExampleId: string | null;
  onAnalyze: (example: ExampleCatalogItem) => void;
  emptyTitle: string;
  emptyDescription: string;
  viewLabel: string;
  hideLabel: string;
  analyzeLabel: string;
  analyzingLabel: string;
}

export function ExamplesCatalogList({
  items,
  locale,
  showCategory = false,
  highlightedExampleId = null,
  pageSize = 6,
  analyzingExampleId,
  onAnalyze,
  emptyTitle,
  emptyDescription,
  viewLabel,
  hideLabel,
  analyzeLabel,
  analyzingLabel,
}: ExamplesCatalogListProps) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!highlightedExampleId) return;
    const index = items.findIndex((item) => item.id === highlightedExampleId);
    if (index < 0) return;
    const targetPage = Math.floor(index / pageSize) + 1;
    setCurrentPage(targetPage);
  }, [highlightedExampleId, items, pageSize]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  if (items.length === 0) {
    return (
      <section className="glass-card rounded-3xl border border-dashed border-white/10 p-8 text-center">
        <h3 className="text-lg font-semibold text-white">{emptyTitle}</h3>
        <p className="mt-2 text-sm text-dark-text">{emptyDescription}</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pageItems.map((example) => (
          <ExampleCatalogCard
            key={example.id}
            example={example}
            locale={locale}
            showCategory={showCategory}
            highlighted={highlightedExampleId === example.id}
            analyzingExampleId={analyzingExampleId}
            onAnalyze={onAnalyze}
            viewLabel={viewLabel}
            hideLabel={hideLabel}
            analyzeLabel={analyzeLabel}
            analyzingLabel={analyzingLabel}
          />
        ))}
      </section>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                page === currentPage
                  ? "border-primary/50 bg-primary/20 text-primary-light"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
