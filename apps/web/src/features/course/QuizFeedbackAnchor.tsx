"use client";

import type { QuizReference } from "@aa/content-catalog";

import { Link } from "@/i18n/navigation";
import type { ContentTargetMap } from "@/lib/content/types";

interface QuizFeedbackAnchorProps {
  title: string;
  refs?: QuizReference[];
  targetMap: ContentTargetMap;
}

export function QuizFeedbackAnchor({
  title,
  refs = [],
  targetMap,
}: QuizFeedbackAnchorProps) {
  if (!refs.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-100/90">
        {title}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {refs.map((ref) => {
          const resolved = ref.target
            ? targetMap[`${ref.target.kind}:${ref.target.ref}`]
            : null;

          if (!resolved) {
            return (
              <span
                key={ref.quizId}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-100"
              >
                {ref.label ?? ref.quizId}
              </span>
            );
          }

          return (
            <Link
              key={ref.quizId}
              href={resolved.href}
              className="rounded-full border border-teal-400/25 bg-teal-500/10 px-3 py-1 text-xs text-teal-100 transition-colors hover:bg-teal-500/20"
            >
              {ref.label ?? ref.quizId}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
