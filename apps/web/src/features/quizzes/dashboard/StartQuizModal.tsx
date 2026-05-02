"use client";

import { BookOpen, Loader2, PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import BaseModalContainer from "@/components/modals/BaseModalContainer";

import type { StartQuizOptions } from "./quizDashboardTypes";

interface StartQuizModalProps {
  open: boolean;
  onClose: () => void;
  onStart: (opts: StartQuizOptions) => void | Promise<void>;
  weakTopics?: string[];
  weakSkillIds?: string[];
  defaultModuleId?: string;
}

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20];

function getQuestionCountTone(value: number): "green" | "yellow" | "red" {
  if (value <= 5) return "green";
  if (value <= 10) return "yellow";
  return "red";
}

function getSelectedQuestionCountClass(value: number): string {
  const tone = getQuestionCountTone(value);
  if (tone === "green")
    return "border-emerald-400/60 bg-emerald-500/15 text-emerald-300";
  if (tone === "yellow")
    return "border-amber-400/60 bg-amber-500/15 text-amber-300";
  return "border-rose-400/60 bg-rose-500/15 text-rose-300";
}

export function StartQuizModal({
  open,
  onClose,
  onStart,
  weakTopics = [],
  weakSkillIds = [],
  defaultModuleId,
}: StartQuizModalProps) {
  const classes = (...items: Array<string | false | null | undefined>) =>
    items.filter(Boolean).join(" ");
  const t = useTranslations("quizzes.modal");

  const [questionCount, setQuestionCount] = useState(10);
  const [isStarting, setIsStarting] = useState(false);

  async function handleStart() {
    setIsStarting(true);
    const opts: StartQuizOptions = {
      questionCount,
      moduleId: defaultModuleId,
    };

    if (weakSkillIds.length > 0) {
      opts.skillIds = weakSkillIds.slice(0, 5);
    } else if (weakTopics.length > 0) {
      opts.topicIds = weakTopics.slice(0, 3);
    }

    try {
      await Promise.resolve(onStart(opts));
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={t("title")}
      titleIcon={<PlayCircle size={20} className="text-slate-200" />}
      sizeClassName="w-[min(95vw,560px)] max-h-[90vh]"
    >
      <div className="space-y-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            {t("recommendedEyebrow")}
          </p>
          <h3 className="mt-2 text-base font-semibold text-white">
            {t("recommendedTitle")}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {t("recommendedDescription")}
          </p>
        </section>

        <div>
          <div className="grid grid-cols-2 gap-3">
            {QUESTION_COUNT_OPTIONS.map((n) => {
              const isSelected = questionCount === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuestionCount(n)}
                  className={classes(
                    "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
                    isSelected
                      ? getSelectedQuestionCountClass(n)
                      : "border-white/10 bg-slate-700/20 text-slate-300 hover:border-slate-300/35 hover:bg-slate-700/35",
                  )}
                >
                  {t("questionCountOption", { count: n })}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.04]"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-400/25 bg-slate-700/35 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700/55 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStarting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <PlayCircle size={18} />
            )}
            {t("start")}
          </button>
        </div>

        <p className="flex items-center gap-2 text-xs text-slate-500">
          <BookOpen size={13} />
          {t("note")}
        </p>
      </div>
    </BaseModalContainer>
  );
}
