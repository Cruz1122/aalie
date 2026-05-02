"use client";

import {
  ArrowRight,
  BarChart3,
  Clock3,
  PlayCircle,
  RotateCcw,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";

export type QuizDashboardCardVariant =
  | "primary"
  | "stats"
  | "weakness"
  | "history"
  | "empty";

interface QuizDashboardCardProps {
  title: string;
  description: string;
  eyebrow?: string;
  icon?: ReactNode;
  progressLabel?: string;
  progressValue?: number | null;
  ctaLabel?: string;
  ctaIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: QuizDashboardCardVariant;
  footer?: ReactNode;
  centered?: boolean;
  hideProgress?: boolean;
}

export function QuizDashboardCard({
  title,
  description,
  eyebrow,
  icon,
  progressLabel,
  progressValue,
  ctaLabel,
  ctaIcon,
  onClick,
  disabled = false,
  variant = "stats",
  footer,
  centered = false,
  hideProgress = false,
}: QuizDashboardCardProps) {
  const classes = (...items: Array<string | false | null | undefined>) =>
    items.filter(Boolean).join(" ");

  const safeProgress =
    typeof progressValue === "number"
      ? Math.max(0, Math.min(100, Math.round(progressValue)))
      : null;

  return (
    <article
      className={classes(
        "documentation-card glass-card group flex h-full min-h-[320px] flex-col rounded-2xl border border-white/10 p-5 text-slate-100",
        "transition-colors duration-200",
        variant === "primary" && "border-slate-400/20 bg-slate-700/20",
        variant === "weakness" && "border-amber-300/20 bg-amber-300/[0.035]",
        variant === "empty" && "border-slate-400/10 bg-slate-400/[0.025]",
        centered && "items-center justify-center text-center",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {eyebrow}
            </p>
          ) : null}

          <h2 className="text-lg font-semibold leading-tight text-white">
            {title}
          </h2>
        </div>

        {icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-300/20 bg-slate-700/30 text-slate-200">
            {icon}
          </div>
        ) : null}
      </div>

      <p
        className={classes(
          "line-clamp-4 flex-1 text-sm leading-6 text-slate-300",
          centered && "flex-initial",
        )}
      >
        {description}
      </p>

      {!hideProgress && safeProgress !== null ? (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
            <span>{progressLabel ?? "Progreso"}</span>
            <span className="font-semibold text-slate-200">
              {safeProgress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-950/60">
            <div
              className="h-full rounded-full bg-primary/80 transition-all"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {footer ? <div className="mt-5">{footer}</div> : null}

      {ctaLabel ? (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={classes(
            "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
            disabled
              ? "cursor-not-allowed border-white/10 bg-white/[0.03] text-slate-500"
              : "border-slate-400/25 bg-slate-700/35 text-slate-100 hover:border-slate-300/40 hover:bg-slate-700/55",
          )}
        >
          {ctaIcon ?? <ArrowRight size={16} />}
          {ctaLabel}
        </button>
      ) : null}
    </article>
  );
}

export const QuizCardIcons = {
  start: <PlayCircle size={22} />,
  stats: <BarChart3 size={22} />,
  weakness: <Target size={22} />,
  history: <Clock3 size={22} />,
  retry: <RotateCcw size={22} />,
};
