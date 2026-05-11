import React from "react";

interface PaginationControlsProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly reserveSpace?: boolean;
  readonly collapseThreshold?: number;
}

export type PaginationItem = number | "ellipsis";

const PAGE_ITEM_BASE_CLASS =
  "inline-flex h-7 w-9 items-center justify-center text-xs tabular-nums";

export function buildPaginationItems(
  currentPage: number,
  totalPages: number,
  collapseThreshold = Number.POSITIVE_INFINITY,
): PaginationItem[] {
  const visibleItemCount = Math.max(collapseThreshold, 5);

  if (totalPages <= 0) {
    return [];
  }

  if (totalPages <= visibleItemCount) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= visibleItemCount - 2) {
    return [
      ...Array.from({ length: visibleItemCount - 2 }, (_, index) => index + 1),
      "ellipsis",
      totalPages,
    ];
  }

  if (currentPage >= totalPages - (visibleItemCount - 3)) {
    return [
      1,
      "ellipsis",
      ...Array.from(
        { length: visibleItemCount - 2 },
        (_, index) => totalPages - (visibleItemCount - 3) + index,
      ),
    ];
  }

  const centeredRangeLength = visibleItemCount - 4;
  const leftOffset = Math.floor((centeredRangeLength - 1) / 2);
  const rangeStart = currentPage - leftOffset;

  return [
    1,
    "ellipsis",
    ...Array.from(
      { length: centeredRangeLength },
      (_, index) => rangeStart + index,
    ),
    "ellipsis",
    totalPages,
  ];
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  reserveSpace = false,
  collapseThreshold = Number.POSITIVE_INFINITY,
}: Readonly<PaginationControlsProps>) {
  if (totalPages <= 1) {
    return reserveSpace ? (
      <div
        className="flex h-7 items-center justify-center"
        aria-hidden="true"
      />
    ) : null;
  }

  const items = buildPaginationItems(
    currentPage,
    totalPages,
    collapseThreshold,
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        ‹
      </button>
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className={`${PAGE_ITEM_BASE_CLASS} text-slate-500`}
            aria-hidden="true"
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? "page" : undefined}
            className={`${PAGE_ITEM_BASE_CLASS} rounded-lg border transition-colors ${
              item === currentPage
                ? "border-primary/50 bg-primary/20 text-primary-light"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white"
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        ›
      </button>
    </div>
  );
}
