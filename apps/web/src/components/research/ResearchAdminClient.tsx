"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Link } from "@/i18n/navigation";

type StudyStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";

type Study = {
  id: string;
  slug: string;
  title: string;
  status: StudyStatus;
  protocolVersion: string;
  consentVersion: string;
  consentSha256: string;
  telemetryEnabled: boolean;
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

type NewStudy = {
  slug: string;
  title: string;
  protocolVersion: string;
  consentVersion: string;
  consentSha256: string;
};

const EMPTY_STUDY: NewStudy = {
  slug: "",
  title: "",
  protocolVersion: "1.0.0",
  consentVersion: "1.0.0",
  consentSha256: "",
};

export function ResearchStudiesList({ locale }: { locale: string }) {
  const [studies, setStudies] = useState<Study[]>([]);
  const [draft, setDraft] = useState<NewStudy>(EMPTY_STUDY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/studies", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    setStudies((await response.json()) as Study[]);
  }, []);

  useEffect(() => {
    void load().catch((cause) =>
      setError(cause instanceof Error ? cause.message : "Request failed"),
    );
  }, [load]);

  const validDraft = useMemo(
    () =>
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug) &&
      draft.slug.length >= 3 &&
      draft.title.trim().length >= 3 &&
      draft.protocolVersion.trim().length > 0 &&
      draft.consentVersion.trim().length > 0 &&
      /^[0-9a-f]{64}$/.test(draft.consentSha256),
    [draft],
  );

  const create = async () => {
    if (!validDraft || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/studies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          detail?: string;
        } | null;
        throw new Error(
          payload?.error ?? payload?.detail ?? `Create failed: HTTP ${response.status}`,
        );
      }
      setDraft(EMPTY_STUDY);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          ADMIN · RESEARCH
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Studies
        </h1>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-white">Create study</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            A new study starts in DRAFT. The consent SHA-256 must identify the
            exact approved consent artifact.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <AdminInput
            label="Slug"
            value={draft.slug}
            placeholder="algorithms-2026"
            onChange={(slug) => setDraft((current) => ({ ...current, slug }))}
          />
          <AdminInput
            label="Title"
            value={draft.title}
            placeholder="Algorithms classroom study"
            onChange={(title) => setDraft((current) => ({ ...current, title }))}
          />
          <AdminInput
            label="Protocol version"
            value={draft.protocolVersion}
            onChange={(protocolVersion) =>
              setDraft((current) => ({ ...current, protocolVersion }))
            }
          />
          <AdminInput
            label="Consent version"
            value={draft.consentVersion}
            onChange={(consentVersion) =>
              setDraft((current) => ({ ...current, consentVersion }))
            }
          />
          <div className="md:col-span-2">
            <AdminInput
              label="Consent SHA-256"
              value={draft.consentSha256}
              placeholder="64 lowercase hexadecimal characters"
              onChange={(consentSha256) =>
                setDraft((current) => ({
                  ...current,
                  consentSha256: consentSha256.trim().toLowerCase(),
                }))
              }
            />
          </div>
        </div>
        <button
          type="button"
          disabled={!validDraft || busy}
          onClick={() => void create()}
          className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Creating…" : "Create DRAFT study"}
        </button>
      </section>

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
                {study.slug} · protocol {study.protocolVersion} · consent {study.consentVersion}
              </div>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
              {study.status}
            </span>
          </Link>
        ))}
        {studies.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No studies yet.</p>
        ) : null}
      </div>
      <p className="text-xs text-slate-500">Locale: {locale}</p>
    </div>
  );
}

export function ResearchStudyDetail({ studyId }: { studyId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const patchStatus = async (
    status: StudyStatus,
    telemetryEnabled: boolean | undefined = summary?.study.telemetryEnabled,
  ) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/studies/${encodeURIComponent(studyId)}/status`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status, telemetryEnabled }),
        },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          detail?: string;
        } | null;
        throw new Error(
          payload?.error ?? payload?.detail ?? `Status update failed: HTTP ${response.status}`,
        );
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Status update failed");
    } finally {
      setBusy(false);
    }
  };

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

  const status = summary?.study.status;

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {summary ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {summary.study.status} · telemetry {summary.study.telemetryEnabled ? "ON" : "OFF"}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                {summary.study.title}
              </h1>
              <p className="mt-2 text-xs text-slate-500">
                Protocol {summary.study.protocolVersion} · consent {summary.study.consentVersion} · SHA {summary.study.consentSha256.slice(0, 12)}…
              </p>
            </div>
            <a
              href={`/api/admin/studies/${encodeURIComponent(studyId)}/export`}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"
            >
              Download dataset
            </a>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-semibold text-white">Study controls</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              CLOSED is terminal. Experimental evidence is recorded only while ACTIVE and all participant gates pass.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {status === "DRAFT" ? (
                <ControlButton
                  disabled={busy}
                  onClick={() => void patchStatus("ACTIVE", false)}
                >
                  Activate
                </ControlButton>
              ) : null}
              {status === "ACTIVE" ? (
                <>
                  <ControlButton
                    disabled={busy}
                    onClick={() => void patchStatus("PAUSED", false)}
                  >
                    Pause
                  </ControlButton>
                  <ControlButton
                    disabled={busy}
                    onClick={() =>
                      void patchStatus(
                        "ACTIVE",
                        !summary.study.telemetryEnabled,
                      )
                    }
                  >
                    Telemetry {summary.study.telemetryEnabled ? "off" : "on"}
                  </ControlButton>
                  <ControlButton
                    disabled={busy}
                    onClick={() => void patchStatus("CLOSED", false)}
                  >
                    Close permanently
                  </ControlButton>
                </>
              ) : null}
              {status === "PAUSED" ? (
                <>
                  <ControlButton
                    disabled={busy}
                    onClick={() => void patchStatus("ACTIVE", false)}
                  >
                    Resume
                  </ControlButton>
                  <ControlButton
                    disabled={busy}
                    onClick={() => void patchStatus("CLOSED", false)}
                  >
                    Close permanently
                  </ControlButton>
                </>
              ) : null}
              {status === "CLOSED" ? (
                <span className="text-sm text-slate-500">No further status transitions are allowed.</span>
              ) : null}
            </div>
          </section>

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
                <div className="mt-1 text-2xl font-bold text-white">{value}</div>
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
                    <td className="px-4 py-3 text-dark-text">{participant.attempts}</td>
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

function AdminInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-slate-400">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/30"
      />
    </label>
  );
}

function ControlButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
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
