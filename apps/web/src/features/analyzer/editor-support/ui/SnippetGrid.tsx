import { useEffect, useMemo, useState } from "react";

import { PaginationControls } from "@/components/PaginationControls";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import { SnippetCard } from "./SnippetCard";
import type { SnippetDefinition } from "../catalog/snippetCatalog";

interface SnippetGridProps {
  readonly snippets: readonly SnippetDefinition[];
  readonly onInsert: (snippet: SnippetDefinition) => void;
  readonly locale: string;
  readonly onHighlight: (snippet: SnippetDefinition) => void;
  readonly onClearHighlight: () => void;
}

export function SnippetGrid({
  snippets,
  onInsert,
  locale,
  onHighlight,
  onClearHighlight,
}: Readonly<SnippetGridProps>) {
  const isMediumUp = useMediaQuery("(min-width: 768px)");
  const isXL = useMediaQuery("(min-width: 1280px)");
  const pageSize = isXL ? 9 : isMediumUp ? 6 : Math.max(snippets.length, 1);
  const totalPages = Math.max(1, Math.ceil(snippets.length / pageSize));
  const [currentPage, setCurrentPage] = useState(1);
  const snippetIdsKey = useMemo(
    () => snippets.map((snippet) => snippet.id).join("|"),
    [snippets],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [snippetIdsKey, pageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const pageSnippets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return snippets.slice(start, start + pageSize);
  }, [currentPage, pageSize, snippets]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="scrollbar-custom min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pageSnippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onInsert={onInsert}
              locale={locale}
              onHighlight={onHighlight}
              onClearHighlight={onClearHighlight}
            />
          ))}
        </div>
      </div>
      <div className="mt-4 shrink-0">
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          reserveSpace
          collapseThreshold={5}
        />
      </div>
    </div>
  );
}
