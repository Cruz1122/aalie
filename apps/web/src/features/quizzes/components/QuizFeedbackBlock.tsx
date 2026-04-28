"use client";

import type { ReactNode } from "react";

export interface QuizFeedbackBlockProps {
  variant?: "info" | "success" | "error" | "warning" | "neutral";
  title?: ReactNode;
  children: ReactNode;
  iconName?: string;
  className?: string;
}

const VARIANT_CLASSNAMES: Record<
  NonNullable<QuizFeedbackBlockProps["variant"]>,
  { container: string; icon: string; defaultIcon: string }
> = {
  info: {
    container: "border-sky-500/35 bg-sky-500/10 text-slate-100",
    icon: "text-sky-300",
    defaultIcon: "info",
  },
  success: {
    container: "border-emerald-500/35 bg-emerald-500/10 text-slate-100",
    icon: "text-emerald-300",
    defaultIcon: "task_alt",
  },
  error: {
    container: "border-rose-500/40 bg-rose-500/10 text-slate-100",
    icon: "text-rose-300",
    defaultIcon: "error",
  },
  warning: {
    container: "border-amber-500/40 bg-amber-500/10 text-slate-100",
    icon: "text-amber-300",
    defaultIcon: "warning",
  },
  neutral: {
    container: "border-white/15 bg-slate-900/40 text-slate-100",
    icon: "text-slate-300",
    defaultIcon: "notes",
  },
};

export function QuizFeedbackBlock({
  variant = "neutral",
  title,
  children,
  iconName,
  className = "",
}: QuizFeedbackBlockProps) {
  const styles = VARIANT_CLASSNAMES[variant];
  return (
    <section
      className={`rounded-lg border p-3 sm:p-4 ${styles.container} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-lg leading-none ${styles.icon}`}
        >
          {iconName ?? styles.defaultIcon}
        </span>
        <div className="min-w-0 flex-1">
          {title ? <h4 className="text-sm font-semibold">{title}</h4> : null}
          <div className={`${title ? "mt-1" : ""} text-sm text-slate-200`}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

