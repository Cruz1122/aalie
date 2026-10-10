"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import ErrorState from "@/components/ErrorState";
import { GlobalLoader } from "@/components/GlobalLoader";

type Student = {
  email: string;
  lastActivityAt: string | null;
  analysis: number;
  traces: number;
  quizzes: number;
  assistant: number;
};

type Activity = {
  occurredAt: string;
  kind: "analysis" | "trace" | "quiz" | "export" | "assistant";
  success: boolean;
};

export function ClassroomRoster() {
  const t = useTranslations("classroom");
  const pages = useTranslations("errorPages");
  const locale = useLocale();
  const [students, setStudents] = useState<Student[]>([]);
  const [rosterError, setRosterError] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [detail, setDetail] = useState<{
    email: string;
    activity: Activity[];
  } | null>(null);
  const [activityError, setActivityError] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);

  const loadRoster = useCallback(() => {
    setRosterLoading(true);
    setRosterError(false);
    void fetch("/api/admin/classroom/roster", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setStudents((await response.json()) as Student[]);
      })
      .catch(() => setRosterError(true))
      .finally(() => setRosterLoading(false));
  }, []);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const loadActivity = useCallback(async (email: string) => {
    setActivityError(false);
    setActivityLoading(true);
    try {
      const response = await fetch(
        `/api/admin/classroom/activity/${encodeURIComponent(email)}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const activity = (await response.json()) as Activity[];
      setDetail({ email, activity });
    } catch {
      setDetail({ email, activity: [] });
      setActivityError(true);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const formatWhen = (value: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString(locale);
  };

  const closeActivity = () => {
    setDetail(null);
    setActivityError(false);
    setActivityLoading(false);
  };

  if (activityLoading || rosterLoading) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <GlobalLoader variant="pulse" size="xl" />
      </div>
    );
  }

  if (detail) {
    if (activityError) {
      return (
        <ErrorState
          contained
          compact
          icon="cloud_off"
          accentClass="text-slate-400"
          homeHref={`/${locale}/admin/research`}
          onHome={closeActivity}
          onRetry={() => loadActivity(detail.email)}
          copy={{
            title: t("loadError.title"),
            homeLabel: t("back"),
            retryLabel: t("loadError.retry"),
          }}
        />
      );
    }
    if (detail.activity.length === 0) {
      return (
        <ErrorState
          contained
          compact
          icon="inbox"
          accentClass="text-slate-400"
          homeHref={`/${locale}/admin/research`}
          onHome={closeActivity}
          copy={{
            title: t("empty.title"),
            homeLabel: t("back"),
          }}
        />
      );
    }
    return (
      <div className="space-y-8">
        <div className="text-center">
          <button
            type="button"
            onClick={closeActivity}
            className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            {t("back")}
          </button>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
            {detail.email}
          </h1>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-center text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">{t("when")}</th>
                <th className="px-4 py-3">{t("action")}</th>
                <th className="px-4 py-3">{t("result")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {detail.activity.map((item) => (
                <tr key={`${item.occurredAt}-${item.kind}`}>
                  <td className="px-4 py-3 text-slate-300">
                    {formatWhen(item.occurredAt)}
                  </td>
                  <td className="px-4 py-3 text-white">
                    {t(`kinds.${item.kind}`)}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {item.success ? t("ok") : t("failed")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (rosterError) {
    return (
      <ErrorState
        contained
        compact
        icon="cloud_off"
        accentClass="text-slate-400"
        homeHref={`/${locale}/admin/research`}
        onRetry={loadRoster}
        copy={{
          title: t("loadError.title"),
          homeLabel: pages("notFound.homeLabel"),
          retryLabel: t("loadError.retry"),
        }}
      />
    );
  }

  if (!rosterLoading && students.length === 0) {
    return (
      <ErrorState
        contained
        compact
        icon="inbox"
        accentClass="text-slate-400"
        homeHref={`/${locale}`}
        copy={{
          title: t("empty.title"),
          homeLabel: pages("notFound.homeLabel"),
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-center text-3xl font-bold tracking-tight text-white">
        2026-2
      </h1>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[760px] text-center text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">{t("student")}</th>
              <th className="px-4 py-3">{t("lastActivity")}</th>
              <th className="px-4 py-3">{t("analysis")}</th>
              <th className="px-4 py-3">{t("traces")}</th>
              <th className="px-4 py-3">{t("quizzes")}</th>
              <th className="px-4 py-3">{t("assistant")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {students.map((student) => (
              <tr key={student.email}>
                <td className="px-4 py-3 text-white">{student.email}</td>
                <td className="px-4 py-3 text-slate-300">
                  {formatWhen(student.lastActivityAt)}
                </td>
                <td className="px-4 py-3 text-slate-300">{student.analysis}</td>
                <td className="px-4 py-3 text-slate-300">{student.traces}</td>
                <td className="px-4 py-3 text-slate-300">{student.quizzes}</td>
                <td className="px-4 py-3 text-slate-300">
                  {student.assistant}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => loadActivity(student.email)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    {t("view")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
