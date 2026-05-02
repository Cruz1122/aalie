"use client";

import { useTranslations } from "next-intl";

interface QuizErrorStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export function QuizErrorState({
  title,
  message,
  className = "",
}: QuizErrorStateProps) {
  const t = useTranslations("quizzes");
  return (
    <section
      className={`glass-card rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-100 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-rose-300"
        >
          error
        </span>
        <div>
          <h3 className="text-sm font-semibold">{title ?? t("error.title")}</h3>
          <p className="mt-1 text-sm text-rose-200">
            {message ?? t("error.backend")}
          </p>
        </div>
      </div>
    </section>
  );
}
