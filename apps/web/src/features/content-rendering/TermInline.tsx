"use client";

import React, { useId, useState } from "react";

import { Link } from "@/i18n/navigation";

import { MaterialIcon } from "./MaterialIcon";

interface TermInlineProps {
  text: string;
  term: {
    label: string;
    definition: string;
  };
  display?: "tooltip" | "highlight";
  href?: string;
}

export function TermInline({ text, term, display, href }: TermInlineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();
  const resolvedClassName =
    display === "highlight"
      ? "rounded bg-sky-400/15 px-1 py-0.5 text-sky-100 font-medium"
      : "border-b border-dashed border-sky-400/60 text-sky-100 cursor-help transition-colors hover:border-sky-400/90 hover:bg-sky-400/5 px-0.5";

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span
        className={resolvedClassName}
        tabIndex={0}
        aria-describedby={tooltipId}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        {text}
      </span>
      {isOpen ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-2 w-72 max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950 p-4 text-left text-white shadow-2xl"
        >
          <span className="block text-sm font-semibold text-white">
            {term.label}
          </span>
          <span className="mt-2 block text-[0.85rem] leading-6 text-white/80">
            {term.definition}
          </span>
          {href ? (
            <span className="mt-3 block border-t border-white/10 pt-3">
              <Link
                href={href}
                className="inline-flex items-center gap-1 text-xs text-sky-300 no-underline hover:underline"
              >
                Ver explicación detallada
                <MaterialIcon name="arrow_forward" style={{ fontSize: 14 }} />
              </Link>
            </span>
          ) : null}
          <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-white/10 bg-slate-950" />
        </span>
      ) : null}
    </span>
  );
}
