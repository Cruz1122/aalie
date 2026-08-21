"use client";

import { useCallback, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

type Study = {
  id: string;
  slug: string;
  title: string;
  protocolVersion: string;
  consentVersion: string;
  consentSha256: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
  telemetryEnabled: boolean;
};

type StudyMe = {
  study: Study;
  participant: {
    id: string;
    participantCode: string;
    condition: "AALIE" | "CONTROL" | null;
    withdrawnAt: string | null;
  } | null;
  consented: boolean;
};

export function StudyParticipationClient({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const spanish = locale === "es";
  const { data: session, isPending } = authClient.useSession();
  const [study, setStudy] = useState<Study | null>(null);
  const [me, setMe] = useState<StudyMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const studyResponse = await fetch(`/api/studies/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!studyResponse.ok) {
      setError(spanish ? "El estudio no está disponible." : "The study is not available.");
      return;
    }
    const currentStudy = (await studyResponse.json()) as Study;
    setStudy(currentStudy);
    if (session?.user) {
      const meResponse = await fetch(`/api/studies/${encodeURIComponent(slug)}/me`, {
        cache: "no-store",
      });
      if (meResponse.ok) setMe((await meResponse.json()) as StudyMe);
    }
  }, [session?.user, slug, spanish]);

  useEffect(() => {
    void load();
  }, [load]);

  const mutate = async (action: "consent" | "withdraw") => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/studies/${encodeURIComponent(slug)}/${action}`,
        { method: "POST" },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; detail?: string }
          | null;
        throw new Error(payload?.error ?? payload?.detail ?? `HTTP ${response.status}`);
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  if (!study && !error) {
    return <p className="text-sm text-slate-400">{spanish ? "Cargando…" : "Loading…"}</p>;
  }

  return (
    <div className="space-y-8">
      {study ? (
        <>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              <span>{study.status}</span>
              <span>Protocol {study.protocolVersion}</span>
              <span>Consent {study.consentVersion}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {study.title}
            </h1>
            <p className="max-w-2xl text-[15px] leading-7 text-dark-text">
              {spanish
                ? "La participación es voluntaria y separada del inicio de sesión. AALIE sigue disponible para uso pedagógico aunque no participes en el estudio."
                : "Participation is voluntary and separate from signing in. AALIE remains available for pedagogical use even if you do not join the study."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <h2 className="font-semibold text-white">
                {spanish ? "Datos de investigación" : "Research data"}
              </h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-dark-text">
                <li>• participant ID + experimental condition</li>
                <li>• quiz question IDs, versions, fingerprints and grades</li>
                <li>• allowlisted feature usage and durations</li>
                <li>• consent history and registered measurements</li>
              </ul>
            </section>
            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <h2 className="font-semibold text-white">
                {spanish ? "No entra al dataset académico" : "Not in the academic dataset"}
              </h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-dark-text">
                <li>• name or email</li>
                <li>• pseudocode source</li>
                <li>• LLM prompts or full responses</li>
                <li>• IP address or user-agent as academic evidence</li>
              </ul>
            </section>
          </div>

          {!session?.user && !isPending ? (
            <button
              type="button"
              onClick={() =>
                void authClient.signIn.social({
                  provider: "google",
                  callbackURL: window.location.href,
                })
              }
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950"
            >
              {spanish ? "Iniciar sesión para participar" : "Sign in to participate"}
            </button>
          ) : null}

          {session?.user && !me?.consented && study.status === "ACTIVE" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void mutate("consent")}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {spanish ? "Acepto participar" : "I consent to participate"}
            </button>
          ) : null}

          {me?.consented ? (
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-emerald-300">
                {spanish ? "Consentimiento registrado" : "Consent recorded"} · {me.participant?.participantCode}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void mutate("withdraw")}
                className="text-sm font-semibold text-amber-200 underline underline-offset-4 disabled:opacity-50"
              >
                {spanish ? "Retirar consentimiento" : "Withdraw consent"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
