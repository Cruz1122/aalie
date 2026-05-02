"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type DropdownType = "default";

export interface DropdownProps<TItem> {
  id: string;
  items: TItem[];
  itemToString: (item: TItem | null) => string;
  itemToValue?: (item: TItem, index: number) => string;
  label?: string;
  titleText?: string;
  helperText?: string;
  invalidText?: string;
  warnText?: string;
  invalid?: boolean;
  warn?: boolean;
  type?: DropdownType;
  value?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  onChange?: (value: string, item: TItem | null) => void;
}

interface DropdownOption<TItem> {
  item: TItem;
  label: string;
  value: string;
  disabled: boolean;
}

function getTriggerStateClasses(invalid: boolean, warn: boolean): string {
  if (invalid) {
    return "border-rose-500/45 bg-rose-500/10 text-rose-100";
  }
  if (warn) {
    return "border-amber-500/45 bg-amber-500/10 text-amber-100";
  }
  return "border-white/10 bg-[#182431] text-slate-100 hover:border-white/20";
}

function getMessage({
  invalid,
  warn,
  helperText,
  invalidText,
  warnText,
}: {
  invalid: boolean;
  warn: boolean;
  helperText?: string;
  invalidText?: string;
  warnText?: string;
}): { text: ReactNode; className: string } | null {
  if (invalid && invalidText) {
    return { text: invalidText, className: "text-rose-300" };
  }
  if (warn && warnText) {
    return { text: warnText, className: "text-amber-300" };
  }
  if (helperText) {
    return { text: helperText, className: "text-slate-400" };
  }
  return null;
}

export function Dropdown<TItem>({
  id,
  items,
  itemToString,
  itemToValue,
  label,
  titleText,
  helperText,
  invalidText,
  warnText,
  invalid = false,
  warn = false,
  type = "default",
  value = "",
  disabled = false,
  className = "",
  triggerClassName = "",
  onChange,
}: DropdownProps<TItem>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const options = useMemo<DropdownOption<TItem>[]>(() => {
    return items.map((item, index) => ({
      item,
      label: itemToString(item),
      value: itemToValue?.(item, index) ?? String(index),
      disabled:
        typeof item === "object" &&
        item !== null &&
        "disabled" in item &&
        Boolean((item as Record<string, unknown>).disabled),
    }));
  }, [itemToString, itemToValue, items]);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const effectiveWarn = !invalid && warn;
  const message = getMessage({
    invalid,
    warn: effectiveWarn,
    helperText,
    invalidText,
    warnText,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spacing = 6;
    const estimatedHeight = Math.min(
      240,
      Math.max(96, options.length * 46 + (label ? 24 : 0) + 12),
    );
    const roomBelow = window.innerHeight - rect.bottom - spacing - 8;
    const roomAbove = rect.top - spacing - 8;
    const openAbove = roomBelow < estimatedHeight && roomAbove > roomBelow;

    const top = openAbove
      ? Math.max(8, rect.top - estimatedHeight - spacing)
      : Math.min(window.innerHeight - 8, rect.bottom + spacing);
    const left = Math.max(8, rect.left);
    const width = Math.max(180, rect.width);

    setPanelStyle({ top, left, width });
  }, [label, options.length]);

  useEffect(() => {
    if (!open) return;
    updatePanelPosition();

    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      const inRoot = rootRef.current?.contains(target) ?? false;
      const inPanel = panelRef.current?.contains(target) ?? false;
      if (!inRoot && !inPanel) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  const selectAt = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange?.(option.value, option.item);
    setOpen(false);
    setHighlightedIndex(index);
  };

  return (
    <div
      ref={rootRef}
      className={`w-full ${className}`}
      data-dropdown-type={type}
    >
      {titleText ? (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-medium text-slate-300"
        >
          {titleText}
        </label>
      ) : null}

      <div className="relative">
        <button
          id={id}
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          className={`inline-flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 ${getTriggerStateClasses(invalid, effectiveWarn)} ${triggerClassName}`}
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => !prev);
            if (!open) {
              setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
            }
          }}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              if (!open) {
                setOpen(true);
                setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
                return;
              }
              setHighlightedIndex((prev) =>
                Math.min(options.length - 1, Math.max(0, prev + 1)),
              );
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              if (!open) {
                setOpen(true);
                setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
                return;
              }
              setHighlightedIndex((prev) => Math.max(0, prev - 1));
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (!open) {
                setOpen(true);
                setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
                return;
              }
              if (highlightedIndex >= 0) {
                selectAt(highlightedIndex);
              }
            }
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        >
          <span
            className={selectedOption ? "text-slate-100" : "text-slate-400"}
          >
            {selectedOption?.label ?? label ?? ""}
          </span>
          <span
            aria-hidden="true"
            className={`material-symbols-outlined text-base leading-none text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          >
            expand_more
          </span>
        </button>

        {open && mounted && panelStyle
          ? createPortal(
              <ul
                ref={panelRef}
                id={`${id}-listbox`}
                role="listbox"
                className="scrollbar-custom fixed max-h-56 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-[#182431] p-2 shadow-2xl"
                style={{
                  top: panelStyle.top,
                  left: panelStyle.left,
                  width: panelStyle.width,
                  zIndex: 2147483647,
                }}
              >
                {label ? (
                  <li
                    className="px-3 py-2.5 text-[11px] text-slate-400"
                    aria-hidden="true"
                  >
                    {label}
                  </li>
                ) : null}
                {options.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <li key={option.value} role="presentation" className="">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        className={`w-full rounded-md px-3 py-2.5 text-left text-[11px] transition-colors hover:!bg-slate-700/70 ${
                          option.disabled
                            ? "cursor-not-allowed text-slate-500 opacity-60"
                            : isSelected
                              ? "bg-slate-700/60 text-slate-100"
                              : isHighlighted
                                ? "bg-slate-800/85 text-slate-100"
                                : "text-slate-200"
                        }`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => selectAt(index)}
                      >
                        {option.label}
                      </button>
                    </li>
                  );
                })}
              </ul>,
              document.body,
            )
          : null}
      </div>

      {message ? (
        <p className={`mt-1 text-xs ${message.className}`}>{message.text}</p>
      ) : null}
    </div>
  );
}
