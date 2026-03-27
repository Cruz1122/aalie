"use client";

import { SlidersHorizontal } from "lucide-react";
import React from "react";

interface ExamplesSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  filtersButtonAriaLabel?: string;
  onToggleFilters?: () => void;
  filtersActive?: boolean;
  filtersDropdown?: React.ReactNode;
}

export function ExamplesSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  filtersButtonAriaLabel,
  onToggleFilters,
  filtersActive = false,
  filtersDropdown,
}: ExamplesSearchInputProps) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3">
      <label className="glass-card flex h-11 flex-1 items-center gap-3 rounded-2xl border border-white/10 px-4">
        <span className="material-symbols-outlined text-slate-400">search</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </label>
      {onToggleFilters && (
        <button
          type="button"
          onClick={onToggleFilters}
          aria-label={filtersButtonAriaLabel ?? "Toggle filters"}
          className={`glass-card inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
            filtersActive
              ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
              : "border-white/10 text-slate-300 hover:border-white/25 hover:text-white hover:bg-white/5"
          }`}
        >
          <SlidersHorizontal size={16} strokeWidth={2.2} />
        </button>
      )}
      </div>
      {onToggleFilters && filtersActive && filtersDropdown && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 max-w-[90vw]">
          {filtersDropdown}
        </div>
      )}
    </div>
  );
}
