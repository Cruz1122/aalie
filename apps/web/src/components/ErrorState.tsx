"use client";

interface ErrorStateCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly homeLabel: string;
  readonly retryLabel?: string;
}

interface ErrorStateProps {
  readonly icon: string;
  readonly accentClass: string;
  readonly copy: ErrorStateCopy;
  readonly homeHref: string;
  readonly onRetry?: () => void;
}

export default function ErrorState({
  icon,
  accentClass,
  copy,
  homeHref,
  onRetry,
}: ErrorStateProps) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#101a23] px-6 py-12 text-center text-white">
      <div className="error-state-content flex w-full max-w-xl flex-col items-center">
        <div
          className={`error-state-icon mb-8 ${accentClass}`}
          aria-hidden="true"
        >
          <span
            className="material-symbols-outlined leading-none"
            style={{ fontSize: "clamp(5rem, 12vw, 8rem)" }}
          >
            {icon}
          </span>
        </div>
        <p
          className={`mb-3 text-sm font-bold uppercase tracking-[0.3em] ${accentClass}`}
        >
          {copy.eyebrow}
        </p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-5xl">
          {copy.title}
        </h1>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={homeHref}
            className="rounded-lg border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.12]"
          >
            {copy.homeLabel}
          </a>
          {onRetry && copy.retryLabel ? (
            <button
              type="button"
              onClick={onRetry}
              className={`rounded-lg border border-current/30 bg-current/10 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-current/20 ${accentClass}`}
            >
              {copy.retryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
