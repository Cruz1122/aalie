"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

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

type TooltipPlacement = "top" | "bottom";

interface TooltipPosition {
  readonly left: number;
  readonly top: number;
  readonly placement: TooltipPlacement;
}

const TOOLTIP_OPEN_DELAY = 140;
const TOOLTIP_CLOSE_DELAY = 180;
const VIEWPORT_MARGIN = 8;
const TOOLTIP_GAP = 10;

export function TermInline({ text, term, display, href }: TermInlineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    left: 0,
    top: 0,
    placement: "top",
  });
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const resolvedClassName =
    display === "highlight"
      ? "rounded bg-sky-400/15 px-1 py-0.5 text-sky-100 font-medium"
      : "border-b border-dashed border-sky-400/60 text-sky-100 cursor-help transition-colors hover:border-sky-400/90 hover:bg-sky-400/5 px-0.5";

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(() => {
    clearCloseTimer();
    clearOpenTimer();
    openTimerRef.current = window.setTimeout(() => {
      setIsOpen(true);
      openTimerRef.current = null;
    }, TOOLTIP_OPEN_DELAY);
  }, [clearCloseTimer, clearOpenTimer]);

  const scheduleClose = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, TOOLTIP_CLOSE_DELAY);
  }, [clearCloseTimer, clearOpenTimer]);

  const positionTooltip = useCallback(() => {
    if (typeof window === "undefined") return;

    const trigger = triggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth =
      tooltipRect?.width ?? Math.min(288, window.innerWidth - VIEWPORT_MARGIN * 2);
    const tooltipHeight = tooltipRect?.height ?? 0;
    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    const minLeft = VIEWPORT_MARGIN + tooltipWidth / 2;
    const maxLeft = Math.max(
      minLeft,
      window.innerWidth - VIEWPORT_MARGIN - tooltipWidth / 2,
    );
    const left = Math.min(Math.max(triggerCenter, minLeft), maxLeft);
    const topCandidate = triggerRect.top - tooltipHeight - TOOLTIP_GAP;
    const placement: TooltipPlacement =
      topCandidate >= VIEWPORT_MARGIN ? "top" : "bottom";
    const top =
      placement === "top"
        ? topCandidate
        : triggerRect.bottom + TOOLTIP_GAP;

    setTooltipPosition({ left, top, placement });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    positionTooltip();
  }, [isOpen, positionTooltip]);

  useEffect(() => {
    if (!isOpen) return;

    const handleViewportChange = () => positionTooltip();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, positionTooltip]);

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, [clearCloseTimer, clearOpenTimer]);

  const tooltip = isOpen ? (
    <span
      ref={tooltipRef}
      id={tooltipId}
      role="tooltip"
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleClose}
      className="fixed z-[100] w-72 max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950 p-4 text-left text-white shadow-2xl"
      style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
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
      {tooltipPosition.placement === "top" ? (
        <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-white/10 bg-slate-950" />
      ) : (
        <span className="absolute bottom-full left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rotate-45 border-l border-t border-white/10 bg-slate-950" />
      )}
    </span>
  ) : null;

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <span
        className={resolvedClassName}
        tabIndex={0}
        aria-describedby={tooltipId}
        aria-expanded={isOpen}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
      >
        {text}
      </span>
      {typeof document !== "undefined" && tooltip
        ? createPortal(tooltip, document.body)
        : null}
    </span>
  );
}
