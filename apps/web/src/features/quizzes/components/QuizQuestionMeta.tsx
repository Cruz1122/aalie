"use client";

import { useTranslations } from "next-intl";

export interface QuizQuestionMetaProps {
  topic?: string;
  current?: number;
}

function toTitleCaseFromSlug(slug: string): string {
  return slug
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function QuizQuestionMeta({ topic, current }: QuizQuestionMetaProps) {
  const t = useTranslations("quizzes");
  const topicLabel = topic
    ? t.has(`topics.${topic}`)
      ? t(`topics.${topic}`)
      : toTitleCaseFromSlug(topic)
    : undefined;

  return (
    <header className="mb-4">
      <h2 className="text-center text-lg font-semibold text-white">
        {typeof current === "number"
          ? t("meta.questionNumber", { current })
          : t("meta.question")}
      </h2>
      {topicLabel ? (
        <p className="mt-1 text-center text-sm text-slate-300">{topicLabel}</p>
      ) : null}
    </header>
  );
}
