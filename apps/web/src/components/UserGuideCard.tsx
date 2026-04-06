"use client";

import { ArrowRight, Clock3, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ContentModuleSummary } from "@/lib/content/types";

import NavigationLink from "./NavigationLink";
import { UserGuideIcon } from "./UserGuideIcons";

interface UserGuideCardProps {
  module: ContentModuleSummary;
  progress: number;
}

export function UserGuideCard({ module, progress }: UserGuideCardProps) {
  const t = useTranslations("contentUi");

  return (
    <article className="documentation-card glass-card relative flex h-full flex-col rounded-2xl border border-white/10 p-4 sm:p-5">
      <div className="absolute right-4 top-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-100">
          <Clock3 size={13} />
          {module.estimatedMinutes ? `${module.estimatedMinutes} min` : "—"}
        </span>
      </div>

      <header className="documentation-card-content gap-3 text-center">
        <UserGuideIcon
          moduleId={module.moduleId}
          size={24}
          className="mx-auto"
        />

        <div className="space-y-2">
          <h2 className="text-base font-bold leading-tight text-white sm:text-lg">
            {module.title}
          </h2>
          {module.summary ? (
            <p className="line-clamp-4 max-w-[28ch] text-sm leading-5 text-slate-300">
              {module.summary}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-4 space-y-2.5">
        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
          <span className="inline-flex items-center gap-2">
            <TrendingUp size={14} />
            {t("progress")}
          </span>
          <span className="text-sm font-semibold tracking-normal text-slate-200">
            {progress}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`${module.title} ${t("progress")}`}
          className="h-2.5 overflow-hidden rounded-full bg-white/5"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <NavigationLink
          href={module.route}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-500/20"
          title={module.title}
        >
          {t("openModule")}
          <ArrowRight size={16} />
        </NavigationLink>
      </div>
    </article>
  );
}
