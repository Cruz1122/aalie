"use client";

import { useTranslations } from "next-intl";
import { useRef, useEffect, useState } from "react";

interface InputSizeControlProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  debounceMs?: number;
  /** Si true, no añade margen inferior (para uso inline con otros controles) */
  noMargin?: boolean;
}

export default function InputSizeControl({
  value,
  min = 1,
  max = 20,
  onChange,
  debounceMs = 800,
  noMargin = false,
}: InputSizeControlProps) {
  const t = useTranslations("analyzer.executionTrace");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`flex items-center gap-3 pb-2 ${noMargin ? "" : "mb-3"}`}>
      <label className="text-xs text-slate-300 whitespace-nowrap">{t("inputSizeLabel")}</label>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={localValue}
          onChange={(e) => {
            const newValue = Number.parseInt(e.target.value, 10);
            handleChange(newValue);
          }}
          className="input-size-slider flex-1 h-2.5 bg-slate-700/60 rounded-full appearance-none cursor-pointer accent-blue-500 hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
        />
        <span className="text-xs text-white font-semibold min-w-[32px] text-right bg-slate-700/50 px-2 py-1 rounded-md border border-white/10 tabular-nums flex-shrink-0">
          {localValue}
        </span>
      </div>
    </div>
  );
}

