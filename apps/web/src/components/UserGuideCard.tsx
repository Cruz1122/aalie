"use client";

import { Clock3, Lock, PlayCircle, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { isModuleQuizEligible } from "@/features/quizzes/lib/moduleQuizEligibility";
import type { ContentModuleSummary } from "@/lib/content/types";

import NavigationLink from "./NavigationLink";
import { UserGuideIcon } from "./UserGuideIcons";

interface UserGuideCardProps {
  module: ContentModuleSummary;
  progress: number;
  locale?: string;
}

export function UserGuideCard({
  module,
  progress,
  locale = "es",
}: UserGuideCardProps) {
  const t = useTranslations("contentUi");
  const router = useRouter();
  const [isRedirectingToQuiz, setIsRedirectingToQuiz] = useState(false);
  const eligible = isModuleQuizEligible(progress);
  const moduleButtonClass =
    "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition-colors hover:bg-primary/20";
  const quizButtonClass =
    "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/20";
  const lockedQuizClass =
    "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-500/20 bg-slate-700/20 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed select-none";
  const actionsContainerClass = "mt-4 flex items-stretch gap-2";

  function handleQuizClick() {
    if (isRedirectingToQuiz) return;
    setIsRedirectingToQuiz(true);
    const params = new URLSearchParams({
      start: "1",
      moduleId: module.moduleId,
      count: "10",
      moduleTitle: module.title,
    });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`/${locale}/quizzes?${params.toString()}` as any);
    } catch {
      setIsRedirectingToQuiz(false);
    }
  }

  return (
    <article className="documentation-card glass-card relative flex h-full flex-col rounded-2xl border border-white/10 p-4 sm:p-5">
      <div className="absolute right-4 top-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-sky-100">
          <Clock3 size={13} />
          {module.estimatedMinutes ? `${module.estimatedMinutes} min` : "—"}
        </span>
      </div>

      <header className="documentation-card-content gap-3">
        <div className="text-center">
          <UserGuideIcon
            moduleId={module.moduleId}
            size={24}
            className="mx-auto"
          />
          <h2 className="mt-3 text-base font-bold leading-tight text-white sm:text-lg">
            {module.title}
          </h2>
        </div>
        {module.summary ? (
          <p className="line-clamp-4 w-full self-stretch text-justify text-sm leading-relaxed text-slate-300">
            {module.summary}
          </p>
        ) : null}
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
            className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400 transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className={actionsContainerClass}>
        {eligible ? (
          <button
            onClick={handleQuizClick}
            id={`quiz-btn-${module.moduleId}`}
            disabled={isRedirectingToQuiz}
            aria-busy={isRedirectingToQuiz}
            className={quizButtonClass}
          >
            {isRedirectingToQuiz ? (
              <span className="inline-block h-[15px] w-[15px] animate-spin rounded-full border-2 border-current border-r-transparent" />
            ) : (
              <PlayCircle size={15} />
            )}
            {t("startQuiz")}
          </button>
        ) : (
          <div className={lockedQuizClass}>
            <Lock size={13} />
            {t("quizLocked", { threshold: 90 })}
          </div>
        )}

        <NavigationLink
          href={module.route}
          className={moduleButtonClass}
          title={module.title}
        >
          {t("openModule")}
        </NavigationLink>
      </div>
    </article>
  );
}
