"use client";

import { Brain, CheckCircle2, Target, Trophy, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import AALIEEmotionIcon, {
  type AALIEEmotionIconName,
} from "@/components/AALIEEmotionIcon";

import type { QuizDashboardMetrics } from "./quizDashboardTypes";
import type { StoredQuizAttempt } from "../storage/quizStorageTypes";

// ─── Emotion helper ─────────────────────────────────────────────────────────
function scoreToEmotion(accuracy: number) {
  if (accuracy >= 0.9)
    return {
      icon: "happy" as AALIEEmotionIconName,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    };
  if (accuracy >= 0.75)
    return {
      icon: "satisfied" as AALIEEmotionIconName,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    };
  if (accuracy >= 0.55)
    return {
      icon: "focused" as AALIEEmotionIconName,
      color: "text-sky-400",
      bg: "bg-sky-400/10",
    };
  return {
    icon: "determined" as AALIEEmotionIconName,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  };
}

// ─── Summary Cards ──────────────────────────────────────────────────────────
interface SummaryCardsProps {
  metrics: QuizDashboardMetrics;
}

export function QuizSummaryCards({ metrics }: SummaryCardsProps) {
  const t = useTranslations("quizzes.dashboard");

  const avgEmotion = scoreToEmotion(metrics.averageAccuracy);
  const pct = Math.round(metrics.averageAccuracy * 100);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Total attempts */}
      <div className="glass-card rounded-2xl border border-white/10 p-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">
          {t("totalAttempts")}
        </p>
        <p className="mt-1.5 text-3xl font-bold text-white">
          {metrics.totalAttempts}
        </p>
        <Brain className="mt-2 text-primary" size={18} />
      </div>

      {/* Average accuracy */}
      <div
        className={`glass-card rounded-2xl border border-white/10 p-4 ${avgEmotion.bg}`}
      >
        <p className="text-xs uppercase tracking-widest text-slate-400">
          {t("avgAccuracy")}
        </p>
        <p className={`mt-1.5 text-3xl font-bold ${avgEmotion.color}`}>
          {pct}%
        </p>
        <AALIEEmotionIcon
          name={avgEmotion.icon}
          size={20}
          className={`mt-2 ${avgEmotion.color}`}
        />
      </div>

      {/* Top strength */}
      <div className="glass-card rounded-2xl border border-white/10 p-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">
          {t("topStrength")}
        </p>
        <p className="mt-1.5 truncate text-sm font-semibold text-emerald-300">
          {metrics.topStrengths[0] ?? "—"}
        </p>
        <CheckCircle2 className="mt-2 text-emerald-400" size={18} />
      </div>

      {/* Top weakness */}
      <div className="glass-card rounded-2xl border border-white/10 p-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">
          {t("topWeakness")}
        </p>
        <p className="mt-1.5 truncate text-sm font-semibold text-orange-300">
          {metrics.topAreasToImprove[0] ?? "—"}
        </p>
        <Target className="mt-2 text-orange-400" size={18} />
      </div>
    </div>
  );
}

// ─── Recent Attempts List ────────────────────────────────────────────────────
interface RecentAttemptsListProps {
  attempts: StoredQuizAttempt[];
}

export function RecentAttemptsList({ attempts }: RecentAttemptsListProps) {
  const t = useTranslations("quizzes.dashboard");

  if (attempts.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center gap-3 rounded-2xl border border-white/10 py-10 text-center">
        <AALIEEmotionIcon name="curious" size={34} className="text-primary" />
        <p className="text-sm text-slate-400">{t("noAttempts")}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {attempts.map((att) => {
        const emotion = scoreToEmotion(att.accuracy);
        const pct = Math.round(att.accuracy * 100);
        const date = new Date(att.timestamp).toLocaleDateString();

        return (
          <li
            key={att.attemptId}
            className="glass-card flex items-center gap-4 rounded-xl border border-white/10 px-4 py-3"
          >
            <AALIEEmotionIcon
              name={emotion.icon}
              size={24}
              className={emotion.color}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {att.moduleId ?? t("generalSession")}
              </p>
              <p className="text-xs text-slate-400">{date}</p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${emotion.color}`}>{pct}%</p>
              <div className="flex items-center gap-1 justify-end text-xs text-slate-400">
                <CheckCircle2 size={11} className="text-emerald-400" />
                <span>{Math.round(att.score)}</span>
                <XCircle size={11} className="text-red-400 ml-1" />
                <span>{Math.round(att.maxScore - att.score)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Mastery Tags ─────────────────────────────────────────────────────────────
interface MasteryTagsProps {
  items: string[];
  variant: "strength" | "weakness";
}

export function MasteryTags({ items, variant }: MasteryTagsProps) {
  const t = useTranslations("quizzes");
  const isStrength = variant === "strength";

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const label = (t.raw(`topics.${item}`) as string | undefined) ?? item;
        return (
          <span
            key={item}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
              isStrength
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-orange-400/30 bg-orange-400/10 text-orange-300"
            }`}
          >
            {isStrength ? <Trophy size={11} /> : <Target size={11} />}
            {label}
          </span>
        );
      })}
    </div>
  );
}
