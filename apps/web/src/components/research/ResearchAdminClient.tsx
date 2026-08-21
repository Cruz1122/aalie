"use client";

import { useCallback, useEffect, useState } from "react";

import { Link } from "@/i18n/navigation";

type Study = {
  id: string;
  slug: string;
  title: string;
  status: string;
  protocolVersion: string;
  consentVersion: string;
};

type Summary = {
  study: Study;
  participants: number;
  activeParticipants: number;
  withdrawn: number;
  excluded: number;
  aalie: number;
  control: number;
  unassigned: number;
  quizAttempts: number;
  completedQuizAttempts: number;
  meanAccuracy: number | null;
};

type Participant = {
  participantId: string;
  participantCode: string;
  condition: "AALIE" | "CONTROL" | null;
  enrolledAt: string;
  withdrawnAt: string | null;
  excludedAt: string | null;
  attempts: number;
  averageAccuracy: number | null;
};

export function ResearchStudiesList({ locale }: { locale: string }) {
  const [studies, setStudies] = useState<Study[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/studies", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as Study[];
      })
      .then(setStudies)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Request failed"),
      );
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          ADMIN · RESEARCH
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Studies
        </h1>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.025]">
        {studies.map((study) => (
          <Link
            key={study.id}
            href={`/admin/research/${study.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.04]"
          >
            <div>
              <div className="font-semibold text-white">{study.title}</div>
              <div className="mt-1 text-xs text-slate-500">
                {study.slug} · {study.protocolVersion}
              </div>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
              {study.status}
            </span>
          </Link>
        ))}
      </div>
      <p className="text-xs text-slate-500">Locale: {locale}</p>
    </div>
  );
}

export function ResearchStudyDetail({ studyId }: { studyId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const encoded = encodeURIComponent(studyId);
    const [summaryResponse, participantsResponse] = await Promise.all([
      fetch(`/api/admin/studies/${encoded}/summary`, { cache: "no-store" }),
      fetch(`/api/admin/studies/${encoded}/participants`, {
        cache: "no-store",
      }),
    ]);
    if (!summaryResponse.ok || !participantsResponse.ok) {
      throw new Error(
        `Research API error ${summaryResponse.status}/${participantsResponse.status}`,
      );
    }
    setSummary((await summaryResponse.json()) as Summary);
    setParticipants((await participantsResponse.json()) as Participant[]);
  }, [studyId]);

  useEffect(() => {
    void load().catch((cause) =>
      setError(cause instanceof Error ? cause.message : "Request failed"),
    );
  }, [load]);

  const assign = async (
    participantId: string,
    condition: "AALIE" | "CONTROL",
  ) => {
    const response = await fetch(
      `/api/admin/studies/${encodeURIComponent(studyId)}/participants/${encodeURIComponent(participantId)}/condition`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ condition }),
      },
    );
    if (!response.ok) {
      throw new Error(`Condition update failed: HTTP ${response.status}`);
    }
    await load();
  };

  if (!summary && !error) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {summary ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {summary.study.status}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                {summary.study.title}
              </h1>
            </div>
            <a
              href={`/api/admin/studies/${encodeURIComponent(studyId)}/export`}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"
            >
              Download dataset
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Participants", summary.participants],
              ["Active", summary.activeParticipants],
              ["Withdrawn", summary.withdrawn],
              ["AALIE", summary.aalie],
              ["CONTROL", summary.control],
              ["Unassigned", summary.unassigned],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
              >
                <div className="text-xs text-slate-500">{label}</div>
                <div className="mt-1 text-2xl font-bold text-white">
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Quiz attempts" value={summary.quizAttempts} />
            <Metric label="Completed" value={summary.completedQuizAttempts} />
            <Metric
              label="Mean accuracy"
              value={
                summary.meanAccuracy == null
                  ? "—"
                  : `${(summary.meanAccuracy * 100).toFixed(1)}%`
              }
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Average score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {participants.map((participant) => (
                  <tr key={participant.participantId}>
                    <td className="px-4 py-3 font-mono text-xs text-white">
                      {participant.participantCode}
                    </td>
                    <td className="px-4 py-3 text-dark-text">
                      {participant.withdrawnAt
                        ? "WITHDRAWN"
                        : participant.excludedAt
                          ? "EXCLUDED"
                          : "ACTIVE"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {(["AALIE", "CONTROL"] as const).map((condition) => (
                          <button
                            key={condition}
                            type="button"
                            disabled={participant.condition === condition}
                            onClick={() =>
                              void assign(
                                participant.participantId,
                                condition,
                              ).catch((cause) =>
                                setError(
                                  cause instanceof Error
                                    ? cause.message
                                    : "Update failed",
                                ),
                              )
                            }
                            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-200 disabled:bg-white/10 disabled:text-white"
                          >
                            {condition}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-text">
                      {participant.attempts}
                    </td>
                    <td className="px-4 py-3 text-dark-text">
                      {participant.averageAccuracy == null
                        ? "—"
                        : `${(participant.averageAccuracy * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
