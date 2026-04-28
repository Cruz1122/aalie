"use client";

import { useTranslations } from "next-intl";

interface QuizEmptyStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export function QuizEmptyState({
  title,
  message,
  className = "",
}: QuizEmptyStateProps) {
  const t = useTranslations("quizzes");
  return (
    <section
      className={`glass-card rounded-xl border border-white/10 p-4 text-slate-200 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span aria-hidden="true" className="material-symbols-outlined text-slate-300">
          inbox
        </span>
        <div>
          <h3 className="text-sm font-semibold">{title ?? t("empty.title")}</h3>
          <p className="mt-1 text-sm text-slate-300">
            {message ?? t("empty.noQuestions")}
          </p>
        </div>
      </div>
    </section>
  );
}
