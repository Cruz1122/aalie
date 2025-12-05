"use client";

import { useRef, useEffect, useState } from "react";

interface InputSizeControlProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  debounceMs?: number;
}

export default function InputSizeControl({
  value,
  min = 1,
  max = 20,
  onChange,
  debounceMs = 800,
}: InputSizeControlProps) {
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
    <div className="flex items-center gap-3 mb-3">
      <label className="text-xs text-slate-300 whitespace-nowrap">Tamaño (n):</label>
      <div className="flex items-center gap-2 flex-1">
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
          className="flex-1 h-2 bg-slate-700/60 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:bg-slate-700/80 transition-colors"
        />
        <span className="text-xs text-white font-semibold min-w-[32px] text-right bg-slate-700/50 px-2 py-0.5 rounded border border-white/10">
          {localValue}
        </span>
      </div>
    </div>
  );
}

